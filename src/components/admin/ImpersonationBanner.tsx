"use client";

import { stopImpersonation } from "@/lib/admin/impersonation";

export default function ImpersonationBanner({
  impersonatedUserId,
}: {
  impersonatedUserId: string;
}) {
  if (!impersonatedUserId) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-sm">
      <span>
        🔐 You are impersonating user:{" "}
        <strong>{impersonatedUserId}</strong>
      </span>

      <form action={stopImpersonation}>
        <button className="underline font-medium">
          Stop impersonation
        </button>
      </form>
    </div>
  );
}