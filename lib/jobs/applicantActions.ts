"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected"
) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    throw new Error("Failed to update application status");
  }
}
