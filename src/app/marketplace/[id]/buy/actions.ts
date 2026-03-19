"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/requireUser";
import { startMarketplaceCheckoutForItem } from "@/lib/payments/service";

export async function createOrder(itemId: string, idempotencyKey?: string) {
  if (!itemId) {
    throw new Error("Missing item id");
  }

  const { user } = await requireUser();

  const checkout = await startMarketplaceCheckoutForItem({
    itemId,
    buyerId: user.id,
    idempotencyKey,
  });

  revalidatePath("/marketplace");
  revalidatePath(`/marketplace/${itemId}`);
  revalidatePath("/marketplace/orders");
  revalidatePath("/notifications");

  return checkout;
}
