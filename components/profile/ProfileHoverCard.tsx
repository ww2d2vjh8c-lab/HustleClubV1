"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type ProfileHoverCardProps = {
  username: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

function getInitials(fullName?: string | null, username?: string) {
  if (fullName) return fullName[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  return "?";
}

export default function ProfileHoverCard({
  username,
  fullName,
  avatarUrl,
  bio,
}: ProfileHoverCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <Link
        href={`/u/${username}`}
        className="flex items-center gap-2 hover:underline"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Avatar"
            width={28}
            height={28}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
            {getInitials(fullName, username)}
          </div>
        )}

        <span className="text-sm font-medium">@{username}</span>
      </Link>

      {/* Hover Card */}
      {open && (
        <div className="absolute z-50 top-full mt-2 w-64 rounded-lg border bg-white shadow-lg p-4">
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold">
                {getInitials(fullName, username)}
              </div>
            )}

            <div>
              <p className="font-semibold">
                {fullName || `@${username}`}
              </p>
              <p className="text-sm text-gray-500">@{username}</p>
            </div>
          </div>

          {bio && (
            <p className="mt-3 text-sm text-gray-700 line-clamp-3">
              {bio}
            </p>
          )}

          <Link
            href={`/u/${username}`}
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            View profile →
          </Link>
        </div>
      )}
    </div>
  );
}
