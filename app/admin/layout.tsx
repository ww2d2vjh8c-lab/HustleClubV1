import { requireAdmin } from "@/lib/supabase/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StopImpersonationBanner from "@/components/admin/StopImpersonationBanner";
import { getImpersonatedUserId } from "@/lib/admin/impersonation.actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const impersonatedUserId = await getImpersonatedUserId();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="md:flex">
        <AdminSidebar />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      {impersonatedUserId && <StopImpersonationBanner />}
    </div>
  );
}
