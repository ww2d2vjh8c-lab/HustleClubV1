import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { jobId } = await req.json();

  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // 1️⃣ Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2️⃣ Prevent duplicate applications
  const { data: existing } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Already applied" },
      { status: 409 }
    );
  }

  // 3️⃣ Insert application
  const { error } = await supabase.from("job_applications").insert({
    job_id: jobId,
    applicant_id: user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to apply" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
