import { createSupabaseServerClient } from "./server";
import { getImpersonatedUserId } from "@/lib/admin/impersonation.actions";

/* ───────────────── USER ───────────────── */

export async function requireUser() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  // 🔁 Impersonation override
  const impersonatedUserId = await getImpersonatedUserId();
  if (impersonatedUserId) {
    return {
      supabase,
      user: { ...user, id: impersonatedUserId },
    };
  }

  return { supabase, user };
}

/* ───────────────── CREATOR ───────────────── */

export async function requireCreator() {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    error ||
    (profile?.role !== "creator" && profile?.role !== "admin")
  ) {
    throw new Error("Creator access required");
  }

  return { supabase, user, role: profile.role };
}

/* ───────────────── ADMIN ───────────────── */

export async function requireAdmin() {
  const { supabase, user } = await requireUser();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error || profile?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { supabase, user };
}