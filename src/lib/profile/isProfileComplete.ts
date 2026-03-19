import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function isProfileComplete(userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url, bio")
    .eq("id", userId)
    .single();

  if (error || !data) return false;

  return Boolean(
    data.username &&
    data.full_name &&
    data.avatar_url &&
    data.bio
  );
}
