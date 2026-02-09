import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin(); // 🔐 guard ONCE

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}