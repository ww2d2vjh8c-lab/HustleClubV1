"use client";

import { useState } from "react";
import { updateApplicationStatus } from "@/app/admin/jobs/applicants/actions";

type Status = "pending" | "accepted" | "rejected";

type Props = {
  applicationId: string;
  status: Status;
};

export default function ApplicationActions({
  applicationId,
  status,
}: Props) {
  const [loading, setLoading] = useState<Status | null>(null);
  const [currentStatus, setCurrentStatus] = useState<Status>(status);
  const [error, setError] = useState<string | null>(null);

  /* 🔒 Once accepted, lock UI completely */
  if (currentStatus === "accepted") {
    return (
      <span className="text-sm font-medium text-green-600">
        ✓ Accepted
      </span>
    );
  }

  async function handleAction(nextStatus: Status) {
    if (loading) return;

    setLoading(nextStatus);
    setError(null);

    try {
      await updateApplicationStatus(applicationId, nextStatus);
      setCurrentStatus(nextStatus);
    } catch (err) {
      setError("Failed to update status");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {/* ACCEPT */}
        <button
          onClick={() => handleAction("accepted")}
          disabled={loading !== null}
          className="px-3 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading === "accepted" ? "Accepting…" : "Accept"}
        </button>

        {/* REJECT */}
        <button
          onClick={() => handleAction("rejected")}
          disabled={loading !== null}
          className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading === "rejected" ? "Rejecting…" : "Reject"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
