"use server";

import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ───────────────── CORE ACCEPT LOGIC ───────────────── */

export async function acceptApplication(applicationId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `
        id,
        job_id,
        jobs (
          created_by,
          is_open
        )
      `
    )
    .eq("id", applicationId)
    .single();

  if (error || !data) {
    throw new Error("Application not found");
  }

  const job = data.jobs?.[0];

  if (!job || job.created_by !== user.id) {
    throw new Error("Unauthorized");
  }

  if (!job.is_open) {
    throw new Error("Job already closed");
  }

  /* ✅ ACCEPT SELECTED APPLICATION */
  await supabase
    .from("job_applications")
    .update({ status: "accepted" })
    .eq("id", applicationId);

  /* ❌ REJECT ALL OTHER APPLICATIONS */
  await supabase
    .from("job_applications")
    .update({ status: "rejected" })
    .eq("job_id", data.job_id)
    .neq("id", applicationId);

  /* 🔒 CLOSE JOB */
  await supabase
    .from("jobs")
    .update({ is_open: false })
    .eq("id", data.job_id);
}

/* ───────────────── COMPATIBILITY EXPORT ───────────────── */

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
    .select(
      `
        id,
        jobs (
          created_by
        )
      `
    )
    .eq("id", applicationId)
    .single();

  if (error || !data || data.jobs?.[0]?.created_by !== user.id) {
    throw new Error("Unauthorized");
  }

  await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);
}
