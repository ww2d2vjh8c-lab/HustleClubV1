import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin(); // ✅ NO ARGUMENT

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id,title,status,created_at");

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Failed to load courses
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Admin · Courses</h1>

      {courses?.length === 0 && (
        <p className="text-gray-500">No courses found.</p>
      )}

      {courses?.map((c) => (
        <div key={c.id} className="border rounded p-3">
          <p className="font-medium">{c.title}</p>
          <p className="text-xs text-gray-500">
            {c.status} · {new Date(c.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}