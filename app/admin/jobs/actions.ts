"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function toggleJobStatus(jobId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, is_open")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    throw new Error("Job not found");
  }

  const nextOpen = !job.is_open;
  const { error: updateError } = await supabase
    .from("jobs")
    .update({ is_open: nextOpen })
    .eq("id", jobId);

  if (updateError) {
    throw new Error("Failed to update job status");
  }

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: nextOpen ? "admin_job_opened" : "admin_job_closed",
    target_type: "job",
    target_id: jobId,
  });

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/dashboard");
}

export async function deleteJob(jobId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) throw new Error("Failed to delete job");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_job_deleted",
    target_type: "job",
    target_id: jobId,
  });

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/dashboard");
}
