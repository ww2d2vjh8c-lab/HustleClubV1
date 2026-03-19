"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toggleJobStatus } from "@/app/admin/jobs/actions";

type Props = {
  id: number;
  title: string;
  createdAt: string;
  applicationsCount: number;
  isOpen?: boolean;
};

export default function JobCard({
  id,
  title,
  createdAt,
  applicationsCount,
  isOpen = true,
}: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="border rounded-xl p-5 bg-white flex items-center justify-between">
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>

        <p className="text-xs text-gray-500">
          Posted on {new Date(createdAt).toLocaleDateString()}
        </p>

        <p className="text-sm text-gray-700">
          {applicationsCount} applicant{applicationsCount !== 1 && "s"}
        </p>

        <span
          className={`inline-block text-xs font-medium mt-1 ${
            isOpen ? "text-green-600" : "text-red-600"
          }`}
        >
          {isOpen ? "Open" : "Closed"}
        </span>
      </div>

      <div className="flex gap-2 items-center">
        <Link
          href={`/admin/jobs/applicants?job=${id}`}
          className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50"
        >
          View applicants
        </Link>

        <button
          onClick={() =>
            startTransition(() =>
              toggleJobStatus(String(id))
            )
          }
          disabled={isPending}
          className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50 disabled:opacity-50"
        >
          {isOpen ? "Close job" : "Re-open"}
        </button>
      </div>
    </div>
  );
}
