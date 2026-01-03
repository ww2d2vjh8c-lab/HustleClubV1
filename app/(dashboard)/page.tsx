"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/client";

type User = {
  id: string;
  email?: string;
};

export default function DashboardPage() {
  const supabase = createSupabaseClient();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    }

    loadUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600">
        Welcome{user?.email ? `, ${user.email}` : ""} 👋
      </p>
    </div>
  );
}
