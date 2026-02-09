"use client";

import { useTransition } from "react";
import { createOrder } from "@/app/marketplace/[id]/buy/actions";

export default function BuyButton({ itemId }: { itemId: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await createOrder(itemId);
            alert("Order placed!");
          } catch (e: any) {
            alert(e.message);
          }
        })
      }
      className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
    >
      {pending ? "Processing..." : "Buy now"}
    </button>
  );
}
