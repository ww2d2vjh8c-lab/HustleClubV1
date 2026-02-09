import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

const { user } = await requireUser();
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
  await supabase
    .from("profiles")
    .update({ role: "creator" })
    .eq("id", data.user_id);

  /* ───── Update request status ───── */
  await supabase
    .from("creator_requests")
    .update({ status: "approved" })
    .eq("id", id);

  return NextResponse.redirect(
    new URL("/admin/creator-requests", process.env.NEXT_PUBLIC_SITE_URL)
  );
}
