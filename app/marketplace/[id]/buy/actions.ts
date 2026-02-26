"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createOrder(itemId: string) {
  if (!itemId) {
    throw new Error("Missing item id");
  }

  const { user } = await requireUser();
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: item, error: itemError } = await supabaseAdmin
    .from("marketplace_items")
    .select("id, price, seller_id, is_sold, is_published")
    .eq("id", itemId)
    .single();

  if (itemError || !item || !item.is_published || item.is_sold) {
    throw new Error("Item not available");
  }

  if (item.seller_id === user.id) {
    throw new Error("You cannot buy your own item");
  }

  // Lock the listing first so two buyers cannot purchase the same item.
  const { data: lockedItem, error: lockError } = await supabaseAdmin
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", item.id)
    .eq("is_sold", false)
    .select("id")
    .maybeSingle();

  if (lockError || !lockedItem) {
    throw new Error("Item was just purchased");
  }

  const { error: orderError } = await supabaseAdmin.from("marketplace_orders").insert({
    item_id: item.id,
    buyer_id: user.id,
    seller_id: item.seller_id,
    price: item.price,
  });

  if (orderError) {
    await supabaseAdmin
      .from("marketplace_items")
      .update({ is_sold: false })
      .eq("id", item.id);
    throw new Error("Failed to create order");
  }

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${item.id}`);
  revalidatePath("/marketplace/orders");
}
