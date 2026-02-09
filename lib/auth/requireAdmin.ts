import { redirect } from "next/navigation";
import { requireUser } from "./requireUser";

export async function requireAdmin() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  return { user, supabase };
}