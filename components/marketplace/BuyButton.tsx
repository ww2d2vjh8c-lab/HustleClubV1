"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/marketplace/[id]/buy/actions";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to place order";
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
            await createOrder(itemId);
            router.push("/marketplace/orders");
            router.refresh();
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
