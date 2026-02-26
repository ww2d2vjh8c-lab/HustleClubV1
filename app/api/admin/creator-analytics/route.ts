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

  const now = Date.now();
  const last30d = now - 30 * 24 * 60 * 60 * 1000;
  const total = data.length;
  const approved = data.filter((request) => request.status === "approved").length;
  const rejected = data.filter((request) => request.status === "rejected").length;
  const pending = data.filter((request) => request.status === "pending").length;
  const created30d = data.filter((request) => new Date(request.created_at).getTime() >= last30d).length;
  const decided = data.filter((request) => request.decided_at);

  const avgReviewHours =
    decided.length === 0
      ? 0
      : Math.round(
          decided.reduce((sum, request) => {
            const start = new Date(request.created_at).getTime();
            const end = new Date(request.decided_at as string).getTime();
            return sum + Math.max(0, end - start);
          }, 0) /
            decided.length /
            36e5
        );

  return NextResponse.json({
    total,
    approved,
    rejected,
    pending,
    created30d,
    approvalRate: decided.length ? Math.round((approved / decided.length) * 100) : 0,
    avgReviewHours,
  });
}
