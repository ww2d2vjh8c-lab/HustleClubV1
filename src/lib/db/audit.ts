import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuditInput {
  actor_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Canonical audit log writer. Always writes to `audit_logs`.
 * Errors are silently swallowed — audit logging must never crash the app.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("audit_logs").insert({
      actor_id: input.actor_id,
      action: input.action,
      target_type: input.target_type ?? null,
      target_id: input.target_id ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    // Audit logging must never crash the app
  }
}
