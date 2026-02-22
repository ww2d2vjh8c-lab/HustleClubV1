import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCreator() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("USER:", user);

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("PROFILE:", profile, "ERROR:", error);

  if (!profile) {
    redirect("/profile");
  }

  if (profile.role !== "creator" && profile.role !== "admin") {
    redirect("/creator/apply");
  }

  return { supabase, user };
}