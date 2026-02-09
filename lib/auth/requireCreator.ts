import { redirect } from "next/navigation";
import { requireUser } from "./requireUser";

export async function requireCreator() {
  const { user, supabase } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "creator" && profile?.role !== "admin") {
    redirect("/become-creator");
  }

  return { user, supabase };
}