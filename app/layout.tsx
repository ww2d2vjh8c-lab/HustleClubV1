import './globals.css';
import { ReactNode } from 'react';
import Navbar from '@/components/navigation/Navbar';

export const metadata = {
  title: 'HustleClub',
  description: 'Creator-first platform for India',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        <main className="p-6">{children}</main>
      </body>
    </html>
  );
}