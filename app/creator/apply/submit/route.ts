import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const formData = await req.formData();
  const message = formData.get("message")?.toString();

  if (!message) {
    return NextResponse.redirect(new URL("/creator/apply", req.url));
  }

  await supabase.from("creator_requests").insert({
    user_id: user.id,
    message,
  });

  return NextResponse.redirect(new URL("/creator/apply", req.url));
}