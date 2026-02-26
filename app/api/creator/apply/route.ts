import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const message =
    typeof body.message === "string"
      ? body.message.trim()
      : "";

  if (!message) {
    return NextResponse.json(
      { error: "Please add a short message for review." },
      { status: 400 }
    );
  }

  const { data: existingRequest } = await supabase
    .from("creator_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existingRequest) {
    return NextResponse.json(
      { error: "You already have a pending creator request." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("creator_requests")
    .insert({
      user_id: user.id,
      message,
      status: "pending",
    });

  if (error) {
    return NextResponse.json(
      { error: "Failed to submit creator request." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
