"use server";

import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markOrderShipped(orderId: string) {
  const user = await requireUser("/admin/marketplace/orders");
  const supabase = await createSupabaseServerClient();

  // 1️⃣ Ownership check
  const { data: order } = await supabase
    .from("marketplace_orders")
    .select("id, status, seller_id")
    .eq("id", orderId)
    .single();

  if (!order || order.seller_id !== user.id) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "paid") {
    throw new Error("Order not ready to ship");
  }

  // 2️⃣ Update status
  await supabase
    .from("marketplace_orders")
    .update({
      status: "shipped",
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}
