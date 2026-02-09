import "./globals.css";
import type { ReactNode } from "react";
import Navbar from "@/components/navigation/Navbar";
import StopImpersonationBanner from "@/components/admin/StopImpersonationBanner";
import { cookies } from "next/headers";

export const metadata = {
  title: "HustleClub",
  description: "Learn, earn, and trade with creators",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // ✅ cookies() IS ASYNC IN NEXT 16
  const cookieStore = await cookies();
  const impersonating = cookieStore.get("impersonator_id");

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        {children}
        {impersonating && <StopImpersonationBanner />}
      </body>
    </html>
  );
}
