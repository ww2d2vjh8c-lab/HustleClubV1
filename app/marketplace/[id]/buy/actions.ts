"use server";

import { requireUser } from "@/lib/auth/requireUser";

export async function createOrder(itemId: string) {
  const { user, supabase } = await requireUser();

  // 1️⃣ Fetch item
  const { data: item } = await supabase
    .from("marketplace_items")
    .select("id, price, seller_id, is_sold")
    .eq("id", itemId)
    .single();

  if (!item || item.is_sold) {
    throw new Error("Item not available");
  }

  if (item.seller_id === user.id) {
    throw new Error("You cannot buy your own item");
  }

  // 2️⃣ Create order
  const { error } = await supabase.from("marketplace_orders").insert({
    item_id: item.id,
    buyer_id: user.id,
    seller_id: item.seller_id,
    price: item.price,
  });

  if (error) {
    throw new Error("Failed to create order");
  }

  // 3️⃣ Lock item
  await supabase
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", item.id);
}