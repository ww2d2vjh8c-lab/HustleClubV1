"use server";

import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ───────────────── BULK UPDATE CREATOR REQUESTS ───────────────── */

export async function bulkUpdateCreatorRequests(
  requestIds: string[],
  status: "approved" | "rejected"
) {
  if (!requestIds.length) return;

  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const decidedAt = new Date().toISOString();

  /* 1️⃣ Update creator request status + decision time */
  const { data: requests, error } = await supabase
    .from("creator_requests")
    .update({
      status,
      decided_at: decidedAt,
    })
    .in("id", requestIds)
    .select("user_id");

  if (error) {
    throw new Error("Failed to update creator requests");
  }

  /* 2️⃣ Promote users if approved */
  if (status === "approved" && requests?.length) {
    const userIds = requests.map((r) => r.user_id);

    await supabase
      .from("profiles")
      .update({ role: "creator" })
      .in("id", userIds);
  }

  /* 3️⃣ Audit log */
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: `creator_requests_bulk_${status}`,
    metadata: {
      requestIds,
      count: requestIds.length,
      decidedAt,
    },
  });
}
