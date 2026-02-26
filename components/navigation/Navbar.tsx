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
  const isCreator = role === "creator" || role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg">
          HustleClub
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-wrap gap-4 text-sm items-center">
          <Link href="/courses">Courses</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/marketplace">Marketplace</Link>

          {user && <Link href="/dashboard">Dashboard</Link>}

          {user && <Link href="/my-courses">My Courses</Link>}
          {user && <Link href="/my-jobs">My Jobs</Link>}
          {user && <Link href="/marketplace/orders">Orders</Link>}

          {user && role === "user" && (
            <Link href="/creator/apply" className="text-blue-600 font-medium">
              Become a Creator
            </Link>
          )}

          {user && isCreator && (
            <Link href="/creator/dashboard" className="text-green-600 font-medium">
              Creator Dashboard
            </Link>
          )}

          {role === "admin" && (
            <Link href="/admin/dashboard" className="text-red-600 font-medium">
              Admin
            </Link>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex gap-4 text-sm">
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
