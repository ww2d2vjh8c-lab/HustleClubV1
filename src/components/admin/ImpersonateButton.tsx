"use client";

import { startImpersonation } from "@/lib/admin/impersonation.actions";
import { useTransition } from "react";

type Props = {
  userId: string;
  userRole: "user" | "creator" | "admin";
};

export default function ImpersonateButton({ userId, userRole }: Props) {
  const [isPending, startTransition] = useTransition();

  if (userRole === "admin") return <span className="text-xs text-gray-400">—</span>;

  return (
    <button
      disabled={isPending}
      onClick={() => startTransition(() => startImpersonation(userId))}
      className="text-xs px-3 py-1 rounded border hover:bg-gray-100"
    >
      {isPending ? "Starting…" : "Impersonate"}
    </button>
  );
}