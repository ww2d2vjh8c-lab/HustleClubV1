"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/db/audit";

type OrderStatus = "paid" | "shipped" | "delivered";

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const { user } = await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const patch: { status: OrderStatus; shipped_at?: string | null; delivered_at?: string | null } = {
    status,
  };

  const now = new Date().toISOString();
  if (status === "shipped") {
    patch.shipped_at = now;
  }
  if (status === "delivered") {
    patch.delivered_at = now;
    patch.shipped_at = patch.shipped_at ?? now;
  }
  if (status === "paid") {
    patch.shipped_at = null;
    patch.delivered_at = null;
  }

  const { error } = await supabase
    .from("marketplace_orders")
    .update(patch)
    .eq("id", orderId);

  if (error) throw new Error("Failed to update order status");

  await logAudit({
    actor_id: user.id,
    action: "admin_order_status_updated",
    target_type: "marketplace_order",
    target_id: orderId,
    metadata: { status },
  });

  revalidatePath("/admin/marketplace/orders");
  revalidatePath("/admin/dashboard");
}

export async function markOrderShipped(orderId: string) {
  return setOrderStatus(orderId, "shipped");
}
