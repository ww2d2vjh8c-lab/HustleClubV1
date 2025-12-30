import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function middleware(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = req.nextUrl.clone();

  // Redirect unauthenticated users to login
  if (!user && url.pathname.startsWith("/dashboard")) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (!user && url.pathname.startsWith("/admin")) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Get user role from metadata
  const { data: userData } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single();

  // Restrict admin route to only admins
  if (url.pathname.startsWith("/admin") && userData?.role !== "admin") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Restrict dashboard route to non-admins (optional)
  if (url.pathname.startsWith("/dashboard") && userData?.role === "admin") {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};