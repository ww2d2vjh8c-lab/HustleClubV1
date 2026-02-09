import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireCreator() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const { data: profile, error: roleError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (roleError || profile?.role !== "creator") {
    throw new Error("Creator access required");
  }

  return { supabase, user };
}