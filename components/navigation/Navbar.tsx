import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import UserMenu from "./UserMenu";

export const dynamic = "force-dynamic";

function getInitials(
  fullName?: string | null,
  username?: string | null,
  email?: string | null
) {
  if (fullName) {
    const parts = fullName.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  }
  if (username) return username[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return "?";
}

export default async function Navbar() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let initials = "?";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, full_name, username")
      .eq("id", user.id)
      .single();

    avatarUrl = profile?.avatar_url ?? null;
    initials = getInitials(
      profile?.full_name,
      profile?.username,
      user.email
    );
  }

  return (
    <nav className="w-full border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          HustleClub
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/courses">Courses</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/marketplace">Marketplace</Link>

          {user ? (
            <UserMenu avatarUrl={avatarUrl} initials={initials} />
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link
                href="/signup"
                className="bg-black text-white px-3 py-1 rounded"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
