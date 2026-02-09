import { requireCreator } from "@/lib/supabase/requireCreator";

export const dynamic = "force-dynamic";

export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireCreator(); // 🔐 guard once

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}