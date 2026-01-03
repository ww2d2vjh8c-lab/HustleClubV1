import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const { supabase } = await requireAdmin();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load jobs</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin · Jobs</h1>

      {jobs && jobs.length === 0 && (
        <p className="text-gray-600">No jobs found.</p>
      )}

      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Title</th>
            <th className="border px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {jobs?.map((job) => (
            <tr key={job.id}>
              <td className="border px-3 py-2">{job.title}</td>
              <td className="border px-3 py-2">
                {new Date(job.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
