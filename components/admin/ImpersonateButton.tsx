"use client";

import { startImpersonation } from "@/lib/admin/impersonation";
import { useTransition } from "react";

export default function ImpersonateButton({
  userId,
}: {
  userId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await startImpersonation(userId);
          window.location.href = "/"; // reload as impersonated user
        })
      }
      disabled={pending}
      className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Switching…" : "Impersonate"}
    </button>
  );
}
