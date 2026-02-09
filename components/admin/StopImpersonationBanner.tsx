"use client";

import { stopImpersonation } from "@/lib/admin/impersonation";

export default function StopImpersonationBanner() {
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          Impersonation active
        </span>
        <button
          onClick={async () => {
            await stopImpersonation();
            window.location.href = "/admin";
          }}
          className="text-xs underline"
        >
          Stop
        </button>
      </div>
    </div>
  );
}
