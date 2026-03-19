import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { submitCreatorRequest } from "@/lib/creator/submitCreatorRequest";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json().catch(() => ({}));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const result = await submitCreatorRequest({
    supabase,
    userId: user.id,
    message:
      typeof body === "object" && body !== null && "message" in body
        ? (body as { message?: unknown }).message
        : undefined,
    requireMessage: false,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Failed to submit request." },
      { status: result.status }
    );
  }

  return NextResponse.json({ success: true });
}
