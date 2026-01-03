"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

type User = {
  id: string;
  email?: string;
};

export default function Navbar() {
  const supabase = createSupabaseClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <nav className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          HustleClub
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/courses">Courses</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/listings">Marketplace</Link>

          {!loading && !user && (
            <Link
              href="/login"
              className="px-3 py-1 border rounded"
            >
              Login
            </Link>
          )}

          {!loading && user && (
            <form action="/signout" method="post">
              <button className="px-3 py-1 border rounded">
                Sign out
              </button>
            </form>
          )}
        </div>
      </div>
    </nav>
  );
}
