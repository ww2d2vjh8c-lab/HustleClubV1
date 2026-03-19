import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { parseCourseDescription } from "@/lib/content/richContent";

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
  const parsed = parseCourseDescription(course.description);
  const { count: enrolledCount } = await supabase
    .from("course_enrollments")
    .select("id", { head: true, count: "exact" })
    .eq("course_id", course.id);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* IMAGE */}
      {course.image_url && (
        <div className="relative w-full h-72 bg-gray-100 rounded-xl overflow-hidden">
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>

            {course.instructor && (
              <p className="text-gray-500 mt-2">By {course.instructor}</p>
            )}

            <p className="text-sm text-gray-400 mt-1">
              Published on {new Date(course.created_at).toLocaleDateString()}
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed">
            {parsed.summary || "This course gives you practical, job-ready skills."}
          </p>

          <SectionList title="What You Will Learn" items={parsed.whatYouWillLearn} />
          <SectionList title="Who This Course Is For" items={parsed.whoIsThisFor} />
          <SectionList title="Requirements" items={parsed.requirements} />
          <SectionList title="Curriculum Snapshot" items={parsed.curriculum} />
        </section>

        <aside className="rounded-xl border bg-white p-5 space-y-4 lg:sticky lg:top-24">
          <p className="text-xs uppercase tracking-wide text-gray-500">Course Access</p>
          <p className="text-2xl font-bold">
            {isFree ? "Free" : `₹${course.price}`}
          </p>
          <p className="text-sm text-gray-600">{enrolledCount ?? 0} learners enrolled</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>Lifetime access</li>
            <li>Creator support</li>
            <li>Learn at your own pace</li>
          </ul>

          {!user ? (
            <Link href="/login" className="block text-center px-6 py-3 bg-black text-white rounded-lg">
              Login to Enroll
            </Link>
          ) : isEnrolled ? (
            <div className="px-6 py-3 bg-green-100 text-green-700 rounded-lg text-center">
              Already Enrolled
            </div>
          ) : (
            <form action={enrollCourse}>
              <input type="hidden" name="courseId" value={course.id} />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
              >
                {isFree ? "Enroll Free" : "Buy & Enroll"}
              </button>
            </form>
          )}

          {isEnrolled && (
            <Link href={`/learn/${course.id}`} className="block text-center text-sm text-blue-600">
              Continue Learning
            </Link>
          )}
        </aside>
      </div>
    </main>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="space-y-2 text-gray-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="border rounded-lg p-3 bg-white">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
