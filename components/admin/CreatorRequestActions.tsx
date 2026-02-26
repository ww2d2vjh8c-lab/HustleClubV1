"use client";

import { useState } from "react";
import { bulkUpdateCreatorRequests } from "@/app/admin/creator-requests/actions";

type Status = "pending" | "approved" | "rejected";

export default function CreatorRequestActions({
  requests,
}: {
  requests: { id: string; status: Status }[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  }

  async function run(status: "approved" | "rejected") {
    setLoading(true);
    await bulkUpdateCreatorRequests(selected, status);
    window.location.reload();
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.length === requests.length
        ? []
        : requests.map((request) => request.id)
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-center">
        <button
          type="button"
          disabled={!requests.length || loading}
          onClick={toggleAll}
          className="px-3 py-2 text-xs border rounded disabled:opacity-50"
        >
          {selected.length === requests.length
            ? "Clear all"
            : "Select all"}
        </button>

        <button
          type="button"
          disabled={!selected.length || loading}
          onClick={() => run("approved")}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded disabled:opacity-50"
        >
          Approve selected
        </button>

        <button
          type="button"
          disabled={!selected.length || loading}
          onClick={() => run("rejected")}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded disabled:opacity-50"
        >
          Reject selected
        </button>

        <span className="text-xs text-gray-500">
          {selected.length} of {requests.length} selected
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {requests.map((request) => {
          const checked = selected.includes(request.id);

          return (
            <label
              key={request.id}
              className={`px-2 py-1 text-xs border rounded cursor-pointer ${
                checked
                  ? "border-black bg-black text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(request.id)}
                className="mr-1 align-middle"
              />
              {request.id.slice(0, 8)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
