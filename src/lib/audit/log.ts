import { logAudit } from "@/lib/db/audit";

type LogInput = {
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

/** @deprecated Use logAudit from @/lib/db/audit directly */
export async function logAuditEvent({
  actorId,
  action,
  targetType,
  targetId,
  metadata,
}: LogInput) {
  await logAudit({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}
