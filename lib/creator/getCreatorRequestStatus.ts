import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCreatorRequestStatus(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("creator_requests")
    .select("status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.status ?? null;
}
