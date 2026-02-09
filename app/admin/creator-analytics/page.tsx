import { requireAdmin } from "@/lib/supabase/auth";
import StatCard from "@/components/admin/StatCard";

export const dynamic = "force-dynamic";

export default async function CreatorAnalyticsPage() {
  const { supabase } = await requireAdmin();

  const [
    users,
    creators,
    pendingCreators,
    jobs,
    applications,
    listings,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "creator"),
    supabase
      .from("creator_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("marketplace_items")
      .select("id", { count: "exact", head: true }),
  ]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Admin Analytics</h1>
        <p className="text-sm text-gray-600">
          Platform overview & growth signals
        </p>
      </header>

      {/* METRICS GRID */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={users.count ?? 0} />
        <StatCard label="Creators" value={creators.count ?? 0} />
        <StatCard
          label="Pending Creator Requests"
          value={pendingCreators.count ?? 0}
        />
        <StatCard label="Jobs Posted" value={jobs.count ?? 0} />
        <StatCard
          label="Job Applications"
          value={applications.count ?? 0}
        />
        <StatCard
          label="Marketplace Listings"
          value={listings.count ?? 0}
        />
      </section>

      {/* STRIPE PLACEHOLDER */}
      <section className="rounded-xl border bg-gray-50 p-6 text-sm text-gray-600">
        💳 Revenue analytics will appear here once Stripe is connected.
      </section>
    </main>
  );
}