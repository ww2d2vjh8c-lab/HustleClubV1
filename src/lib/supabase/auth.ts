import { createSupabaseServerClient } from "./server";
import { getImpersonatedUserId } from "@/lib/admin/impersonation";

type RequireUserOptions = {
  ignoreImpersonation?: boolean;
};

/* ───────────────── USER ───────────────── */

export async function requireUser(options: RequireUserOptions = {}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new Error("Unauthorized");
  }

  const impersonatedUserId = await getImpersonatedUserId();
  const isImpersonating =
    !options.ignoreImpersonation &&
    Boolean(impersonatedUserId) &&
    impersonatedUserId !== authUser.id;

  const user = isImpersonating
    ? ({ ...authUser, id: impersonatedUserId! } as typeof authUser)
    : authUser;

  return { supabase, user, authUser, isImpersonating, impersonatedUserId };
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
  const { supabase, authUser } = await requireUser({ ignoreImpersonation: true });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (error || profile?.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { supabase, user: authUser };
}
