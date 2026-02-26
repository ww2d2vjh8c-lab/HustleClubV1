"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";
import { submitCreatorRequest } from "@/lib/creator/submitCreatorRequest";

export async function requestCreatorAccess() {
  const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();

  const result = await submitCreatorRequest({
    supabase,
    userId: user.id,
    requireMessage: false,
  });

  if (!result.ok && result.status === 409) {
    return;
  }

  if (!result.ok) {
    throw new Error(result.error ?? "Failed to submit request");
  }
}
