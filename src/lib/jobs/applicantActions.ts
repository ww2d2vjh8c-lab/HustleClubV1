"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireCreator } from "@/lib/supabase/auth";

export async function updateApplicationStatus(
  applicationId: string,
  status: "accepted" | "rejected"
) {
  const { user } = await requireCreator();

  const supabase = await createSupabaseServerClient();

  // Verify the application belongs to a job owned by this creator
  const { data: application, error: fetchError } = await supabase
    .from("job_applications")
    .select("id, job_id, jobs!inner(creator_id)")
    .eq("id", applicationId)
    .single();

  if (fetchError || !application) {
    throw new Error("Application not found");
  }

  const job = Array.isArray(application.jobs) ? application.jobs[0] : application.jobs;
  if (!job || job.creator_id !== user.id) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    throw new Error("Failed to update application status");
  }
}
