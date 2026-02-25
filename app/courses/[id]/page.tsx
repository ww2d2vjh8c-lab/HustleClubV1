import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Course = {
  id: number;
  title: string;
  description: string | null;
  instructor: string | null;
  image_url: string | null;
  created_at: string;
  status: string;
  price: number | null;
};

/* ================= SERVER ACTION ================= */

async function enrollCourse(formData: FormData) {
  "use server";

  const courseId = Number(formData.get("courseId"));

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Prevent duplicate enrollment
  const { data: existing } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    await supabase.from("course_enrollments").insert({
      course_id: courseId,
      user_id: user.id,
    });
  }

  redirect(`/courses/${courseId}`);
}

/* ================= PAGE ================= */

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      instructor,
      image_url,
      created_at,
      status,
      price
    `)
    .eq("id", Number(id))
    .eq("status", "published")
    .single<Course>();

  if (error || !course) {
    notFound();
  }

  let isEnrolled = false;

  if (user) {
    const { data: enrollment } = await supabase
      .from("course_enrollments")
      .select("id")
      .eq("course_id", course.id)
      .eq("user_id", user.id)
      .single();

    if (enrollment) {
      isEnrolled = true;
    }
  }

  const isFree = !course.price || Number(course.price) === 0;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* IMAGE */}
      {course.image_url && (
        <div className="w-full h-72 bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>

        {course.instructor && (
          <p className="text-gray-500 mt-2">
            By {course.instructor}
          </p>
        )}

        <p className="text-sm text-gray-400 mt-1">
          Published on{" "}
          {new Date(course.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* PRICE */}
      <div className="text-xl font-semibold">
        {isFree ? (
          <span className="text-green-600">Free Course</span>
        ) : (
          <span>₹ {course.price}</span>
        )}
      </div>

      {/* DESCRIPTION */}
      {course.description && (
        <div className="text-gray-700 leading-relaxed">
          {course.description}
        </div>
      )}

      {/* ENROLL BUTTON */}
      <div className="pt-6">
        {!user ? (
          <button
            onClick={() => redirect("/login")}
            className="px-6 py-3 bg-black text-white rounded-lg"
          >
            Login to Enroll
          </button>
        ) : isEnrolled ? (
          <div className="px-6 py-3 bg-green-100 text-green-700 rounded-lg inline-block">
            Already Enrolled
          </div>
        ) : (
          <form action={enrollCourse}>
            <input
              type="hidden"
              name="courseId"
              value={course.id}
            />
            <button
              type="submit"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              {isFree ? "Enroll Free" : "Buy & Enroll"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}