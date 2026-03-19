import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Role = "user" | "creator" | "admin";

export async function requireRole(
  allowed: Role[],
  redirectTo = "/"
) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !allowed.includes(profile.role)) {
    redirect(redirectTo);
  }

  return { user, role: profile.role as Role };
}
