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

  return (
    <div className="flex gap-3 items-center">
      <button
        disabled={!selected.length || loading}
        onClick={() => run("approved")}
        className="px-4 py-2 text-sm bg-green-600 text-white rounded disabled:opacity-50"
      >
        Approve selected
      </button>

      <button
        disabled={!selected.length || loading}
        onClick={() => run("rejected")}
        className="px-4 py-2 text-sm bg-red-600 text-white rounded disabled:opacity-50"
      >
        Reject selected
      </button>

      <span className="text-xs text-gray-500">
        {selected.length} selected
      </span>
    </div>
  );
}
