import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const jobId = Number(id);

  if (Number.isNaN(jobId)) {
    return NextResponse.json({ applied: false, closed: true });
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: job } = await supabase
    .from("jobs")
    .select("is_open")
    .eq("id", jobId)
    .single();

  if (!job || !job.is_open) {
    return NextResponse.json({
      applied: false,
      closed: true,
    });
  }

  if (!user) {
    return NextResponse.json({ applied: false, closed: false });
  }

  const { data } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    applied: Boolean(data),
    closed: false,
  });
}
