'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function Navbar() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <nav className="flex justify-between items-center bg-white shadow-sm px-6 py-3 text-black">
      <Link href="/" className="font-bold text-xl text-indigo-600">
        HustleClub
      </Link>
      <div className="flex gap-4 text-gray-700">
        <Link href="/courses">Courses</Link>
        <Link href="/jobs">Jobs</Link>
        <Link href="/thrift">Thrift</Link>
        <Link href="/news">News</Link>
        {user ? (
          <button onClick={handleLogout} className="text-red-500">
            Logout
          </button>
        ) : (
          <Link href="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}