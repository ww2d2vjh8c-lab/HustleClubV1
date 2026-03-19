"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import {
  finalizeMarketplacePaymentTransaction,
  markPaymentTransactionFailed,
} from "@/lib/payments/service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function simulatePaymentSuccess(transactionId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const finalized = await finalizeMarketplacePaymentTransaction(transactionId);

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_payment_marked_succeeded",
    target_type: "payment_transaction",
    target_id: transactionId,
    metadata: { orderId: finalized.orderId },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/marketplace/orders");
  revalidatePath("/admin/dashboard");
}

export async function simulatePaymentFailure(transactionId: string) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  await markPaymentTransactionFailed(transactionId, "Marked failed by admin");

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_payment_marked_failed",
    target_type: "payment_transaction",
    target_id: transactionId,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/dashboard");
}
