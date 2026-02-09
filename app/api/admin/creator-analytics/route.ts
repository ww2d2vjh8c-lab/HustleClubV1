import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function GET() {
  const { supabase } = await requireAdmin();

  const { data, error } = await supabase
    .from("creator_requests")
    .select("status, created_at, decided_at");

  if (error || !data) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }

  const total = data.length;

  const approved = data.filter(r => r.status === "approved").length;
  const rejected = data.filter(r => r.status === "rejected").length;
  const pending = data.filter(r => r.status === "pending").length;

  const decided = data.filter(r => r.decided_at);

  const avgReviewHours =
    decided.length === 0
      ? 0
      : Math.round(
          decided.reduce((sum, r) => {
            const start = new Date(r.created_at).getTime();
            const end = new Date(r.decided_at!).getTime();
            return sum + (end - start);
          }, 0) /
            decided.length /
            36e5
        );

  return NextResponse.json({
    total,
    approved,
    rejected,
    pending,
    approvalRate: total ? Math.round((approved / total) * 100) : 0,
    avgReviewHours,
  });
}
