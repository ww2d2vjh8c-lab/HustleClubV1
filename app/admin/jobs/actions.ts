"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/requireUser";

export async function toggleJobStatus(jobId: string) {
  const user = await requireUser("/admin/jobs");
  const supabase = await createSupabaseServerClient();

  // 🔒 Verify ownership + get current status
  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, is_open")
    .eq("id", jobId)
    .eq("created_by", user.id)
    .single();

  if (error || !job) {
    throw new Error("Unauthorized");
  }

  // 🔁 Toggle status
  const { error: updateError } = await supabase
    .from("jobs")
    .update({ is_open: !job.is_open })
    .eq("id", jobId);

  if (updateError) {
    throw new Error("Failed to update job status");
  }
}
