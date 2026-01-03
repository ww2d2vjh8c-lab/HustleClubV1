"use server";

import { requireUser } from "../lib/supabase/auth";


export async function applyToJob(jobId: number) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    applicant_id: user.id,
  });

  if (error) throw error;
}
