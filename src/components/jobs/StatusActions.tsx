"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/app/admin/jobs/applicants/actions";

export default function StatusActions({
  applicationId,
  currentStatus,
}: {
  applicationId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  if (currentStatus !== "pending") {
    return (
      <span
        className={`text-xs font-medium ${
          currentStatus === "accepted"
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {currentStatus}
      </span>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            updateApplicationStatus(applicationId, "accepted")
          )
        }
        className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        Accept
      </button>

      <button
        disabled={isPending}
        onClick={() =>
          startTransition(() =>
            updateApplicationStatus(applicationId, "rejected")
          )
        }
        className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}
