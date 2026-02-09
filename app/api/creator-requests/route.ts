import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { message } = await req.json();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // prevent duplicate requests
  const { data: existing } = await supabase
    .from("creator_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Request already submitted" },
      { status: 409 }
    );
  }

  await supabase.from("creator_requests").insert({
    user_id: user.id,
    message,
  });

  return NextResponse.json({ success: true });
}
