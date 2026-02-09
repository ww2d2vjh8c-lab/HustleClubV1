import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect("/login");
  }

  // Store request (manual approval)
  await supabase
    .from("creator_requests")
    .insert({
      user_id: user.id,
      status: "pending",
    });

  return NextResponse.redirect("/profile");
}
