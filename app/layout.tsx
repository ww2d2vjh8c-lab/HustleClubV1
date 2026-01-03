import "./globals.css";
import { ReactNode } from "react";
import Navbar from "@/components/navigation/Navbar";

export const metadata = {
  title: "HustleClub",
  description: "Creator-first platform for learning, earning, and trading",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
