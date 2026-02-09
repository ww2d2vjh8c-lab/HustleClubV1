import { createSupabaseServerClient } from "@/lib/supabase/server";

type LogInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
};

export async function logAuditEvent({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: LogInput) {
  const supabase = await createSupabaseServerClient();

  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    metadata: metadata ?? null,
  });
}
