"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";

type ProfileRole = "user" | "creator" | "admin" | null;

export default function Navbar() {
  const supabase = createSupabaseClient();

  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<ProfileRole>(null);
  const [loading, setLoading] = useState(true);
  const [pendingCreators, setPendingCreators] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        setUser(user);

        if (!user) {
          setRole(null);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Failed to load profile role", error);
          setRole("user");
          return;
        }

        const userRole: ProfileRole = profile?.role ?? "user";
        setRole(userRole);

        // 🔔 ADMIN ONLY — pending creator requests count
        if (userRole === "admin") {
          try {
            const res = await fetch(
              "/api/admin/pending-creator-requests",
              { cache: "no-store" }
            );
            const data = await res.json();
            setPendingCreators(data?.count ?? 0);
          } catch {
            setPendingCreators(0);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
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

          {/* USER → CREATOR CTA */}
          {!loading && user && role === "user" && (
            <Link
              href="/creator/apply"
              className="text-blue-600 font-medium"
            >
              Become a Creator
            </Link>
          )}

          {/* CREATOR DASHBOARD */}
          {!loading && user && role === "creator" && (
            <Link
              href="/admin/dashboard"
              className="text-green-600 font-medium"
            >
              Creator Dashboard
            </Link>
          )}

          {/* ADMIN: CREATOR REQUESTS */}
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

          {/* ADMIN: AUDIT LOGS */}
          {!loading && role === "admin" && (
            <Link
              href="/admin/audit-logs"
              className="text-gray-700 font-medium"
            >
              Audit Logs
            </Link>
          )}

          {/* ADMIN: CREATOR ANALYTICS */}
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