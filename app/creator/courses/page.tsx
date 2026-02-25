import { requireCreator } from "@/lib/supabase/requireCreator";
import Link from "next/link";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: number;
  title: string;
  status: string;
  created_at: string;
};

export default async function CreatorCoursesPage() {
  const { user, supabase } = await requireCreator();

  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, status, created_at")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<CourseRow[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load courses.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Your Courses</h1>

        <Link
          href="/creator/courses/new"
          className="px-4 py-2 bg-black text-white rounded-md text-sm"
        >
          Create Course
        </Link>
      </header>

      {!courses || courses.length === 0 ? (
        <p className="text-gray-500">You haven’t created any courses yet.</p>
      ) : (
        <section className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="border rounded-lg p-4 bg-white flex justify-between items-center"
            >
              <div>
                <h2 className="font-semibold">{course.title}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(course.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs mt-1">
                  Status: {course.status}
                </p>
              </div>

              <Link
                href={`/creator/courses/${course.id}/edit`}
                className="text-sm underline"
              >
                Manage
              </Link>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}