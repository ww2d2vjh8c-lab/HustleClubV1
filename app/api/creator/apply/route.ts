import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitCreatorRequest } from "@/lib/creator/submitCreatorRequest";

type ApplyRequestBody = {
  message?: unknown;
};

export async function POST(req: Request) {
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

  const body = (await req
    .json()
    .catch(() => ({}))) as ApplyRequestBody;
  const result = await submitCreatorRequest({
    supabase,
    userId: user.id,
    message: body.message,
    requireMessage: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to submit creator request." },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true });
}
