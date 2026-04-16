import "@/globals.css";
import Navbar from "@/components/navigation/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Manrope, Sora } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: "user" | "creator" | "admin" = "user";
  let avatarUrl: string | null = null;
  let initials = "U";

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, avatar_url, full_name, username")
      .eq("id", user.id)
      .single();

    if (data?.role) {
      role = data.role;
    }
    if (data?.avatar_url) {
      avatarUrl = data.avatar_url;
    }
    if (data?.full_name) {
      initials = data.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    } else if (data?.username) {
      initials = data.username.slice(0, 2).toUpperCase();
    } else if (user.email) {
      initials = user.email[0].toUpperCase();
    }
  }

  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <body className="font-[var(--font-body)] antialiased text-slate-900">
        <Navbar user={user} role={role} avatarUrl={avatarUrl} initials={initials} />
        <div className="pb-16">{children}</div>
      </body>
    </html>
  );
}