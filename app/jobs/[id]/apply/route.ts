import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const jobId = Number(id);

  if (Number.isNaN(jobId)) {
    return NextResponse.json(
      { error: "Invalid job id" },
      { status: 400 }
    );
  }

  // 🔒 Check duplicate application
  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "You have already applied to this job." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("job_applications")
    .insert({
      job_id: jobId,
      applicant_id: user.id,
      status: "pending",
    });

  if (error) {
    return NextResponse.json(
      { error: "Failed to apply" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
