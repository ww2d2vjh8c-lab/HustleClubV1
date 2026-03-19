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

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (data?.role) {
      role = data.role;
    }
  }

  return (
    <html lang="en" className={`${manrope.variable} ${sora.variable}`}>
      <body className="font-[var(--font-body)] antialiased text-slate-900">
        <Navbar user={user} role={role} />
        <div className="pb-16">{children}</div>
      </body>
    </html>
  );
}