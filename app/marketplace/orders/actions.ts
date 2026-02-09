"use server";

import { requireUser } from "@/lib/auth/requireUser";

export async function confirmDelivery(orderId: string) {
  const { user, supabase } = await requireUser();

  const { data: order } = await supabase
    .from("marketplace_orders")
    .select("id, status, buyer_id")
    .eq("id", orderId)
    .single();

  if (!order || order.buyer_id !== user.id) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "shipped") {
    throw new Error("Order not delivered yet");
  }

  await supabase
    .from("marketplace_orders")
    .update({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}