"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/marketplace/[id]/buy/actions";

const CHECKOUT_KEY_PREFIX = "hc_marketplace_checkout_";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to place order";
}

function buildIdempotencyKey() {
  return `mkp_${crypto.randomUUID().replace(/-/g, "")}`;
}

function getStorageKey(itemId: string) {
  return `${CHECKOUT_KEY_PREFIX}${itemId}`;
}

function getOrCreateCheckoutKey(itemId: string): string {
  const storageKey = getStorageKey(itemId);
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const generated = buildIdempotencyKey();
  window.sessionStorage.setItem(storageKey, generated);
  return generated;
}

function clearCheckoutKey(itemId: string) {
  window.sessionStorage.removeItem(getStorageKey(itemId));
}

export default function BuyButton({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            const checkoutKey = getOrCreateCheckoutKey(itemId);
            const checkout = await createOrder(itemId, checkoutKey);

            if (checkout?.idempotencyKey) {
              window.sessionStorage.setItem(getStorageKey(itemId), checkout.idempotencyKey);
            }

            if (checkout?.status === "succeeded") {
              clearCheckoutKey(itemId);
              router.push("/marketplace/orders");
              router.refresh();
              return;
            }

            if (checkout?.status === "failed" || checkout?.status === "cancelled") {
              clearCheckoutKey(itemId);
            }

            if (checkout?.checkoutUrl) {
              window.location.href = checkout.checkoutUrl;
              return;
            }

            alert(checkout?.message ?? "Payment checkout created");
          } catch (error: unknown) {
            alert(getErrorMessage(error));
          }
        })
      }
      className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
    >
      {pending ? "Processing..." : "Buy now"}
    </button>
  );
}
