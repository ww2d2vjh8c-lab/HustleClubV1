import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

type Course = {
  id: number;
  title: string;
  description: string | null;
  instructor: string | null;
  image_url: string | null;
  created_at: string;
};

export default async function CoursesPage() {
  const supabase = await createSupabaseServerClient();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      instructor,
      image_url,
      created_at
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<Course[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load courses.
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-gray-600 mt-2">
          Learn real skills from creators.
        </p>
      </header>

      {!courses || courses.length === 0 ? (
        <p className="text-gray-500">
          No courses available yet.
        </p>
      ) : (
        <section className="grid md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="border rounded-xl p-5 bg-white hover:shadow-md transition"
            >
              {course.image_url && (
                <div className="relative mb-4 h-40 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={course.image_url}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              )}

              <h2 className="font-semibold text-lg">
                {course.title}
              </h2>

              {course.instructor && (
                <p className="text-sm text-gray-500 mt-1">
                  By {course.instructor}
                </p>
              )}

              {course.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                  {course.description}
                </p>
              )}
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
