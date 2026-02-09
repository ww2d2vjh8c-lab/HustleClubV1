"use server";

import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function markOrderShipped(orderId: string) {
  // ✅ Any logged-in seller can do this
  const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();

  // 1️⃣ Ownership check
  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .select("id, status, seller_id")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Order not found");
  }

  if (order.seller_id !== user.id) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "paid") {
    throw new Error("Order not ready to ship");
  }

  // 2️⃣ Update status
  const { error: updateError } = await supabase
    .from("marketplace_orders")
    .update({
      status: "shipped",
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateError) {
    throw updateError;
  }
}