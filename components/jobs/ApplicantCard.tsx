"use client";

import { useTransition } from "react";
import { updateApplicationStatus } from "@/app/admin/jobs/applicants/actions";

type Props = {
  applicationId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  appliedAt: string;
  status: "pending" | "accepted" | "rejected";
};

export default function ApplicantCard({
  applicationId,
  username,
  fullName,
  avatarUrl,
  bio,
  appliedAt,
  status,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleUpdate(newStatus: "accepted" | "rejected") {
    startTransition(() => {
      updateApplicationStatus(applicationId, newStatus);
    });
  }

  return (
    <div className="border rounded-xl p-5 flex gap-4 bg-white">
      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex-1">
        <p className="font-medium">
          {fullName || username || "Anonymous"}
        </p>

        {bio && (
          <p className="text-sm text-gray-600 mt-1">{bio}</p>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Applied on {new Date(appliedAt).toLocaleDateString()}
        </p>

        {/* STATUS */}
        {status !== "pending" && (
          <p
            className={`mt-2 text-sm font-medium ${
              status === "accepted"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {status.toUpperCase()}
          </p>
        )}
      </div>

      {/* ACTIONS */}
      {status === "pending" && (
        <div className="flex flex-col gap-2">
          <button
            disabled={isPending}
            onClick={() => handleUpdate("accepted")}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
          >
            Accept
          </button>

          <button
            disabled={isPending}
            onClick={() => handleUpdate("rejected")}
            className="px-4 py-2 rounded-md bg-red-500 text-white text-sm hover:bg-red-600 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
