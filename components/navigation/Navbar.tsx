"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

type ProfileRole = "user" | "creator" | "admin";

export default function Navbar() {
  const supabase = createSupabaseClient();

  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<ProfileRole>("user");
  const [loading, setLoading] = useState(true);
  const [pendingCreators, setPendingCreators] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadInitialSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setUser(session?.user ?? null);

      if (session?.user) {
        await loadRole(session.user.id);
      }

      setLoading(false);
    }

    async function loadRole(userId: string) {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (!mounted) return;

      if (!error && data?.role) {
        setRole(data.role);
      } else {
        setRole("user");
      }

      // Admin badge
      if (data?.role === "admin") {
        try {
          const res = await fetch("/api/admin/pending-creator-requests", {
            cache: "no-store",
          });
          const json = await res.json();
          setPendingCreators(json?.count ?? 0);
        } catch {
          setPendingCreators(0);
        }
      }
    }

    // 1️⃣ Initial load
    loadInitialSession();

    // 2️⃣ Listen to auth changes (CRITICAL)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await loadRole(session.user.id);
        } else {
          setRole("user");
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between">
        {/* LEFT */}
        <Link href="/" className="font-bold text-lg">
          HustleClub
        </Link>

        {/* CENTER */}
        <nav className="hidden md:flex gap-6 text-sm items-center">
          <Link href="/courses">Courses</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/marketplace">Marketplace</Link>

          {!loading && user && role === "user" && (
            <Link href="/creator/apply" className="text-blue-600 font-medium">
              Become a Creator
            </Link>
          )}

          {!loading && user && role === "creator" && (
            <Link
              href="/creator/dashboard"
              className="text-green-600 font-medium"
            >
              Creator Dashboard
            </Link>
          )}

          {!loading && role === "admin" && (
            <Link
              href="/admin/creator-requests"
              className="relative text-red-600 font-medium"
            >
              Creator Requests
              {pendingCreators > 0 && (
                <span className="absolute -top-2 -right-3 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                  {pendingCreators}
                </span>
              )}
            </Link>
          )}

          {!loading && role === "admin" && (
            <Link href="/admin/audit-logs" className="text-gray-700 font-medium">
              Audit Logs
            </Link>
          )}

          {!loading && role === "admin" && (
            <Link
              href="/admin/creator-analytics"
              className="text-purple-600 font-medium"
            >
              Creator Analytics
            </Link>
          )}
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-sm">
          {!loading && user ? (
            <>
              <Link href="/profile">Profile</Link>
              <form action="/signout" method="post">
                <button type="submit" className="text-red-500">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            !loading && (
              <>
                <Link href="/login">Login</Link>
                <Link
                  href="/signup"
                  className="px-3 py-1 rounded bg-black text-white"
                >
                  Sign up
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}