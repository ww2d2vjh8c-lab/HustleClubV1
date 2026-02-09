import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const supabase = await createSupabaseServerClient();

  // 1️⃣ Create auth user ONLY
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // 2️⃣ Do NOT create profile here
  // Profile is created safely on /profile page (server + authenticated)

  return NextResponse.json({ success: true });
}
