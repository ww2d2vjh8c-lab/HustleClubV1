import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/profile";

/**
 * Base auth guard
 * - Ensures user is logged in
 * - Backward compatible (no role required)
 */
export async function requireUser(next?: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  return user;
}

/**
 * Role-based guard
 * - Ensures user is logged in
 * - Ensures user has required role(s)
 */
export async function requireRole(
  roles: UserRole | UserRole[],
  next?: string
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.role || !allowedRoles.includes(profile.role)) {
    redirect("/"); // or /unauthorized if you add one later
  }

  return user;
}
