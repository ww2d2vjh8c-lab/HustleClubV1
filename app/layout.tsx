import "./globals.css";
import Navbar from "@/components/navigation/Navbar";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
      .maybeSingle();

    if (data?.role) {
      role = data.role;
    }
  }

  return (
    <html lang="en">
      <body>
        <Navbar user={user} role={role} />
        {children}
      </body>
    </html>
  );
}