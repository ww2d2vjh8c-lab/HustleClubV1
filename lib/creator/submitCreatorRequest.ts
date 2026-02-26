import type { SupabaseClient } from "@supabase/supabase-js";

type SubmitCreatorRequestInput = {
  supabase: SupabaseClient;
  userId: string;
  message?: unknown;
  requireMessage?: boolean;
};

type SubmitCreatorRequestResult = {
  ok: boolean;
  status: number;
  error?: string;
};

export async function submitCreatorRequest({
  supabase,
  userId,
  message,
  requireMessage = false,
}: SubmitCreatorRequestInput): Promise<SubmitCreatorRequestResult> {
  const normalizedMessage =
    typeof message === "string" ? message.trim() : "";

  if (requireMessage && !normalizedMessage) {
    return {
      ok: false,
      status: 400,
      error: "Please add a short message for review.",
    };
  }

  const { data: existingRequest, error: existingError } = await supabase
    .from("creator_requests")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingError) {
    return {
      ok: false,
      status: 500,
      error: "Failed to check existing request.",
    };
  }

  if (existingRequest) {
    return {
      ok: false,
      status: 409,
      error: "You already have a pending creator request.",
    };
  }

  const payload: {
    user_id: string;
    status: "pending";
    message?: string;
  } = {
    user_id: userId,
    status: "pending",
  };

  if (normalizedMessage) {
    payload.message = normalizedMessage;
  }

  const { error: insertError } = await supabase
    .from("creator_requests")
    .insert(payload);

  if (insertError) {
    return {
      ok: false,
      status: 500,
      error: "Failed to submit creator request.",
    };
  }

  return { ok: true, status: 200 };
}
