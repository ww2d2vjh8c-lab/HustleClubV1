"use client";

import Image from "next/image";
import { useState } from "react";

type Applicant = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
};

export default function ApplicantModal({
  applicant,
  children,
}: {
  applicant: Applicant;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div onClick={() => setOpen(true)} className="cursor-pointer">
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md rounded-xl p-6 relative shadow-lg">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-gray-500"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                {applicant.avatar_url && (
                  <Image
                    src={applicant.avatar_url}
                    alt="Avatar"
                    fill
                    className="object-cover"
                  />
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  {applicant.full_name || "No name"}
                </h2>
                <p className="text-sm text-gray-500">
                  @{applicant.username || "anonymous"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}