import "@/globals.css";
import Navbar from "@/components/navigation/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Bebas_Neue, Space_Grotesk, Space_Mono } from "next/font/google";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
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
    <html lang="en" className={`${bebasNeue.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="font-[var(--font-body)] antialiased isolate">
        <Navbar user={user} role={role} avatarUrl={avatarUrl} initials={initials} />
        <div className="pb-16">{children}</div>
      </body>
    </html>
  );
}