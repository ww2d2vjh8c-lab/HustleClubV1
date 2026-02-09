"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";

export async function requestCreatorAccess() {
  const user = await requireUser("/become-creator");
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("creator_requests")
    .insert({ user_id: user.id });

  if (error?.code === "23505") {
    // duplicate request
    return;
  }

  if (error) {
    throw new Error("Failed to submit request");
  }
}
