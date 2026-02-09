import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Application = {
  created_at: string;
  status: "pending" | "accepted" | "rejected";
  job: {
    title: string;
  }[];
};

export default async function MyJobsPage() {
  const user = await requireUser("/my-jobs");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `
        created_at,
        status,
        job:jobs (
          title
        )
      `
    )
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Failed to load applications.
      </div>
    );
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Applications</h1>

      {(!data || data.length === 0) && (
        <p className="text-gray-500">You haven’t applied to any jobs yet.</p>
      )}

      <section className="space-y-4">
        {data?.map((a, i) => (
          <div
            key={i}
            className="border rounded-xl p-4 bg-white flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{a.job[0]?.title}</p>
              <p className="text-xs text-gray-500">
                Applied on {new Date(a.created_at).toLocaleDateString()}
              </p>
            </div>

            <StatusBadge status={a.status} />
          </div>
        ))}
      </section>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "accepted") {
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700">
        Accepted
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
      Pending
    </span>
  );
}
