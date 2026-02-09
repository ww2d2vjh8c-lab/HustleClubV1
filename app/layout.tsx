import "./globals.css";
import Navbar from "@/components/navigation/Navbar";
import StopImpersonationBanner from "@/components/admin/StopImpersonationBanner";
import { cookies } from "next/headers";
import { IMPERSONATE_COOKIE } from "@/lib/admin/impersonation/constants";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const impersonating = cookieStore.get(IMPERSONATE_COOKIE);

  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
        {impersonating && <StopImpersonationBanner />}
      </body>
    </html>
  );
}