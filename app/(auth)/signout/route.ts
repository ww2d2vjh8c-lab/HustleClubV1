import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createServerSupabaseClient(); // ✅ add await

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error during signout:", error);
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login`, {
    status: 302,
  });
}