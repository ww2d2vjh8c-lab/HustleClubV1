import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireProfile(userId: string, next?: string) {
  const supabase = await createSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", userId)
    .single();

  if (!profile?.username || !profile?.avatar_url) {
    redirect(`/profile${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  }

  return profile;
}
