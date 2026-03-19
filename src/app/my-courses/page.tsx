import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

type EnrolledCourse = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

type EnrollmentRow = {
  course: EnrolledCourse | EnrolledCourse[] | null;
};

export default async function MyCoursesPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 🔐 Require login
  if (!user) {
    redirect("/login");
  }

  const { data: enrollments, error } = await supabase
    .from("course_enrollments")
    .select(`
      course:courses (
        id,
        title,
        description,
        image_url,
        created_at
      )
    `)
    .eq("user_id", user.id)
    .returns<EnrollmentRow[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load your courses.
      </div>
    );
  }

  const courses: EnrolledCourse[] =
    enrollments?.flatMap((enrollment) => {
      if (!enrollment.course) return [];
      return Array.isArray(enrollment.course)
        ? enrollment.course
        : [enrollment.course];
    }) ?? [];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">
          My Courses
        </h1>
        <p className="text-gray-600 mt-2">
          Courses you are enrolled in.
        </p>
      </header>

      {courses.length === 0 ? (
        <p className="text-gray-500">
          You haven’t enrolled in any courses yet.
        </p>
      ) : (
        <section className="grid md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/learn/${course.id}`}   // 🔐 Protected route
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

              {course.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                  {course.description}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-3">
                Enrolled on{" "}
                {new Date(course.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
