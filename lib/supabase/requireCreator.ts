import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCreator() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1️⃣ Not logged in
  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .maybeSingle();

if (error || !profile) {
  redirect("/profile");
}

  // 2️⃣ Not creator or admin
  if (
    profile?.role !== "creator" &&
    profile?.role !== "admin"
  ) {
    redirect("/creator/apply");
  }

  return { supabase, user };
}