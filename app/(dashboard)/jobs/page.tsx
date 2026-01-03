import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("id, title, description, created_at")
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
      <h1 className="text-2xl font-bold mb-4">Jobs</h1>

      {jobs && jobs.length === 0 && (
        <p className="text-gray-600">No jobs available yet.</p>
      )}

      <ul className="space-y-4">
        {jobs?.map((job) => (
          <li
            key={job.id}
            className="border rounded p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">{job.title}</h2>
            {job.description && (
              <p className="text-gray-600 mt-1">
                {job.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
