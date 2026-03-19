"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function acceptApplication(applicationId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("job_applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .single();

  if (error || !data) {
    throw new Error("Application not found");
  }

  const { error: acceptError } = await supabase
    .from("job_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  if (acceptError) throw new Error("Failed to accept application");

  await supabase
    .from("job_applications")
    .update({ status: "rejected" })
    .eq("job_id", data.job_id)
    .neq("id", applicationId);

  await supabase
    .from("jobs")
    .update({ is_open: false })
    .eq("id", data.job_id);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_application_accepted",
    target_type: "job_application",
    target_id: applicationId,
    metadata: { jobId: data.job_id },
  });

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/jobs/applicants");
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "pending" | "accepted" | "rejected"
) {
  if (status === "accepted") {
    return acceptApplication(applicationId);
  }

  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("job_applications")
    .select("id, job_id")
    .eq("id", applicationId)
    .single();

  if (error || !data) {
    throw new Error("Application not found");
  }

  const { error: updateError } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (updateError) throw new Error("Failed to update application status");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_application_status_updated",
    target_type: "job_application",
    target_id: applicationId,
    metadata: { status, jobId: data.job_id },
  });

  revalidatePath("/admin/jobs/applicants");
  revalidatePath("/admin/jobs");
}
