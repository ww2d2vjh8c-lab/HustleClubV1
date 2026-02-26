import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  /* ───── Fetch request with ownership check ───── */
  const { data, error } = await supabase
    .from("creator_requests")
    .select(
      `
        id,
        user_id,
        status
      `
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Request not found" },
      { status: 404 }
    );
  }

  /* ───── Promote user to creator ───── */
  const { error: promoteError } = await supabase
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", data.user_id);
  if (promoteError) {
    return NextResponse.json(
      { error: "Failed to promote user role" },
      { status: 500 }
    );
  }

  /* ───── Update request status ───── */
  const { error: requestError } = await supabase
    .from("creator_requests")
    .update({
      status: "approved",
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (requestError) {
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "creator_request_approved",
    target_type: "creator_request",
    target_id: id,
  });

  return NextResponse.redirect(
    new URL("/admin/creator-requests", request.url)
  );
}
