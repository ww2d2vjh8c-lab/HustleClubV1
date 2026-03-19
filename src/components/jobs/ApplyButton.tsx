"use client";

import { useEffect, useState } from "react";

export default function ApplyButton({ jobId }: { jobId: number }) {
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [checking, setChecking] = useState(true);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(
          `/api/jobs/${jobId}/application-status`
        );
        const data = await res.json();
        setApplied(Boolean(data.applied));
        setClosed(Boolean(data.closed));
      } catch {
        // silent
      } finally {
        setChecking(false);
      }
    }

    checkStatus();
  }, [jobId]);

  if (checking) {
    return (
      <span className="text-sm text-gray-400">
        Checking application…
      </span>
    );
  }

  if (closed) {
    return (
      <span className="text-sm font-medium text-gray-400">
        Applications closed
      </span>
    );
  }

  if (applied) {
    return (
      <span className="text-sm font-medium text-green-600">
        ✓ Applied
      </span>
    );
  }

  async function handleApply() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/jobs/${jobId}/apply`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Failed to apply");
        return;
      }

      setApplied(true);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleApply}
        disabled={loading}
        className="text-sm px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Applying…" : "Apply"}
      </button>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
