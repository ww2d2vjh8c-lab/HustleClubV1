import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, status, created_at")
    .eq("status", "published")
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
      <h1 className="text-2xl font-bold mb-4">Courses</h1>

      {courses && courses.length === 0 && (
        <p className="text-gray-600">No courses available yet.</p>
      )}

      <ul className="space-y-4">
        {courses?.map((course) => (
          <li
            key={course.id}
            className="border rounded p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">{course.title}</h2>
            {course.description && (
              <p className="text-gray-600 mt-1">
                {course.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
