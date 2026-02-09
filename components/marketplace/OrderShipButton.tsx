"use client";

import { useTransition } from "react";
import { markOrderShipped } from "@/app/admin/marketplace/orders/actions";

export default function OrderShipButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(() => markOrderShipped(orderId))
      }
      disabled={pending}
      className="px-3 py-1 text-sm rounded bg-black text-white disabled:opacity-50"
    >
      {pending ? "Marking..." : "Mark as shipped"}
    </button>
  );
}
