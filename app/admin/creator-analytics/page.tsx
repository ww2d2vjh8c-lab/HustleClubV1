import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function CreatorAnalyticsPage() {
  const { supabase } = await requireAdmin();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/creator-analytics`,
    { cache: "no-store" }
  );

  const data = await res.json();

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Creator Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Requests" value={data.total} />
        <Stat label="Approved" value={data.approved} />
        <Stat label="Rejected" value={data.rejected} />
        <Stat label="Pending" value={data.pending} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Approval Rate"
          value={`${data.approvalRate}%`}
        />
        <Stat
          label="Avg Review Time"
          value={`${data.avgReviewHours} hrs`}
        />
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
