/**
 * HustleClub — Analytics Aggregation Pipeline
 * Supabase Edge Function · Scheduled daily at 00:30 IST (19:00 UTC)
 *
 * What this does:
 *   1. Counts new users, creators, jobs, orders, revenue for the past 24h
 *   2. Writes a daily snapshot row to `analytics_daily_snapshots`
 *   3. Updates creator-level rolling stats in `creator_stats`
 *
 * To deploy:
 *   supabase functions deploy aggregate-analytics
 *
 * To schedule (run once in Supabase SQL editor):
 *   select cron.schedule(
 *     'aggregate-analytics-daily',
 *     '0 19 * * *',   -- 00:30 IST = 19:00 UTC
 *     $$
 *       select net.http_post(
 *         url := 'https://<project>.supabase.co/functions/v1/aggregate-analytics',
 *         headers := '{"Authorization": "Bearer <anon_key>"}'::jsonb
 *       );
 *     $$
 *   );
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

interface DailySnapshot {
  snapshot_date:     string;
  new_users:         number;
  new_creators:      number;
  new_jobs:          number;
  new_applications:  number;
  new_orders:        number;
  gross_revenue_paise: number;
  active_users:      number;
}

Deno.serve(async (req) => {
  // Allow Supabase cron + manual calls
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const now       = new Date();
    const since     = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sinceISO  = since.toISOString();
    const dateStr   = now.toISOString().split("T")[0]; // YYYY-MM-DD

    // ── Parallel counts ────────────────────────────────────────────────────
    const [
      newUsersRes,
      newCreatorsRes,
      newJobsRes,
      newAppsRes,
      newOrdersRes,
      revenueRes,
      activeUsersRes,
    ] = await Promise.all([
      // New users
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceISO),

      // New approved creators
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "creator")
        .gte("updated_at", sinceISO),

      // New jobs
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceISO),

      // New job applications
      supabase
        .from("job_applications")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceISO),

      // New marketplace orders
      supabase
        .from("marketplace_orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceISO),

      // Gross revenue (sum of succeeded transactions in paise/smallest unit)
      supabase
        .from("payment_transactions")
        .select("amount_paise")
        .eq("status", "succeeded")
        .gte("updated_at", sinceISO),

      // Active users (any profile updated/created in last 24h as proxy)
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", sinceISO),
    ]);

    const grossRevenue = (revenueRes.data ?? []).reduce(
      (sum: number, row: { amount_paise: number }) => sum + (row.amount_paise ?? 0),
      0
    );

    const snapshot: DailySnapshot = {
      snapshot_date:       dateStr,
      new_users:           newUsersRes.count    ?? 0,
      new_creators:        newCreatorsRes.count ?? 0,
      new_jobs:            newJobsRes.count     ?? 0,
      new_applications:    newAppsRes.count     ?? 0,
      new_orders:          newOrdersRes.count   ?? 0,
      gross_revenue_paise: grossRevenue,
      active_users:        activeUsersRes.count ?? 0,
    };

    // ── Upsert daily snapshot ──────────────────────────────────────────────
    const { error: snapshotError } = await supabase
      .from("analytics_daily_snapshots")
      .upsert(snapshot, { onConflict: "snapshot_date" });

    if (snapshotError) throw snapshotError;

    // ── Update creator-level rolling stats ─────────────────────────────────
    // Get all creators with orders or applications in the window
    const { data: creatorIds } = await supabase
      .from("marketplace_orders")
      .select("seller_id")
      .gte("created_at", sinceISO);

    const uniqueCreators = [...new Set((creatorIds ?? []).map((r: { seller_id: string }) => r.seller_id))];

    for (const creatorId of uniqueCreators) {
      const [totalOrdersRes, totalRevenueRes, totalJobsRes] = await Promise.all([
        supabase
          .from("marketplace_orders")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", creatorId),
        supabase
          .from("payment_transactions")
          .select("amount_paise")
          .eq("status", "succeeded")
          .eq("seller_id", creatorId),
        supabase
          .from("jobs")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", creatorId),
      ]);

      const totalRevenue = (totalRevenueRes.data ?? []).reduce(
        (sum: number, row: { amount_paise: number }) => sum + (row.amount_paise ?? 0),
        0
      );

      await supabase
        .from("creator_stats")
        .upsert({
          creator_id:           creatorId,
          total_orders:         totalOrdersRes.count ?? 0,
          total_revenue_paise:  totalRevenue,
          total_jobs:           totalJobsRes.count ?? 0,
          last_updated:         now.toISOString(),
        }, { onConflict: "creator_id" });
    }

    console.log(`[aggregate-analytics] Snapshot written for ${dateStr}`, snapshot);

    return new Response(
      JSON.stringify({ success: true, date: dateStr, snapshot }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[aggregate-analytics] Error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
