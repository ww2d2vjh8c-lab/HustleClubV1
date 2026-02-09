"use client";

import { stopImpersonation } from "@/lib/admin/impersonation.actions";

export default function StopImpersonationBanner() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl">
      <span className="text-sm font-medium">
        You are impersonating a user
      </span>

      <form action={stopImpersonation}>
        <button className="ml-4 underline text-sm">
          Stop impersonation
        </button>
      </form>
    </div>
  );
}