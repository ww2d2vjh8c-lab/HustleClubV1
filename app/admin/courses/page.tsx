import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load courses</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin · Courses</h1>

      {courses && courses.length === 0 && (
        <p className="text-gray-600">No courses found.</p>
      )}

      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Title</th>
            <th className="border px-3 py-2 text-left">Status</th>
            <th className="border px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {courses?.map((course) => (
            <tr key={course.id}>
              <td className="border px-3 py-2">{course.title}</td>
              <td className="border px-3 py-2">{course.status}</td>
              <td className="border px-3 py-2">
                {new Date(course.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
