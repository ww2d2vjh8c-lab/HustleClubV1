"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";

type Role = "user" | "creator" | "admin";

export default function Navbar({
  user,
  role,
}: {
  user: User | null;
  role: Role;
}) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          HustleClub
        </Link>

        <nav className="hidden md:flex gap-6 text-sm items-center">
          <Link href="/courses">Courses</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/marketplace">Marketplace</Link>

          {user && role === "user" && (
            <Link href="/creator/apply" className="text-blue-600 font-medium">
              Become a Creator
            </Link>
          )}

          {user && (role === "creator" || role === "admin") && (
            <Link
              href="/creator/dashboard"
              className="text-green-600 font-medium"
            >
              Creator Dashboard
            </Link>
          )}

          {role === "admin" && (
            <Link
              href="/admin/creator-requests"
              className="text-red-600 font-medium"
            >
              Creator Requests
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/profile">Profile</Link>
              <form action="/signout" method="post">
                <button type="submit" className="text-red-500">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link
                href="/signup"
                className="px-3 py-1 rounded bg-black text-white"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}