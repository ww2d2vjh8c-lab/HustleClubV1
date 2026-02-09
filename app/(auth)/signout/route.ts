// app/(auth)/signout/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  const response = NextResponse.redirect(
    new URL(
      "/login",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
    )
  );

  return response;
}