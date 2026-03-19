import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { parseCourseDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type Course = {
  id: number;
  title: string;
  description: string | null;
  instructor: string | null;
  image_url: string | null;
  created_at: string;
  price: number | null;
};

type CoursesPageProps = {
  searchParams?: {
    q?: string;
    sort?: string;
  };
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const supabase = await createSupabaseServerClient();
  const { q: rawQ, sort: rawSort } = searchParams ?? {};
  const q = rawQ?.trim() ?? "";
  const sort = rawSort ?? "newest";

  let query = supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      instructor,
      image_url,
      created_at,
      price
    `)
    .eq("status", "published");

  if (q) {
    const safeQ = q.replace(/[%,"']/g, " ").trim();
    if (safeQ) {
      query = query.or(
        `title.ilike.%${safeQ}%,description.ilike.%${safeQ}%,instructor.ilike.%${safeQ}%`
      );
    }
  }

  if (sort === "price_low") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_high") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: courses, error } = await query.returns<Course[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load courses.
      </div>
    );
  }

  const courseIds = courses?.map((course) => course.id) ?? [];
  const { data: enrollmentRows } = courseIds.length
    ? await supabase
        .from("course_enrollments")
        .select("course_id")
        .in("course_id", courseIds)
    : { data: [] as { course_id: number }[] };

  const enrollmentMap = (enrollmentRows ?? []).reduce<Record<number, number>>(
    (acc, row) => {
      acc[row.course_id] = (acc[row.course_id] ?? 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">Courses</h1>
        <p className="text-gray-600 mt-2">
          Learn real skills from creators.
        </p>
      </header>

      <form className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search courses, creators, keywords..."
          className="w-full border rounded-lg px-3 py-2"
        />
        <select name="sort" defaultValue={sort} className="w-full border rounded-lg px-3 py-2">
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
        <button className="rounded-lg bg-black text-white px-4 py-2">Search</button>
      </form>

      {!courses || courses.length === 0 ? (
        <p className="text-gray-500">
          No courses available yet.
        </p>
      ) : (
        <section className="grid md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              enrollmentCount={enrollmentMap[course.id] ?? 0}
            />
          ))}
        </section>
      )}
    </main>
  );
}

function CourseCard({
  course,
  enrollmentCount,
}: {
  course: Course;
  enrollmentCount: number;
}) {
  const parsed = parseCourseDescription(course.description);
  const summary = parsed.summary || "Learn practical skills with step-by-step guidance.";
  const isFree = !course.price || Number(course.price) === 0;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="border rounded-xl p-5 bg-white hover:shadow-md transition space-y-3"
    >
      {course.image_url && (
        <div className="relative mb-2 h-40 bg-gray-100 rounded overflow-hidden">
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        </div>
      )}

      <h2 className="font-semibold text-lg">{course.title}</h2>

      {course.instructor && <p className="text-sm text-gray-500">By {course.instructor}</p>}

      <p className="text-sm text-gray-600 line-clamp-3">{summary}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="px-2 py-1 rounded-full bg-gray-100">
          {isFree ? "Free" : `₹${course.price}`}
        </span>
        <span className="px-2 py-1 rounded-full bg-gray-100">{enrollmentCount} enrolled</span>
        <span className="px-2 py-1 rounded-full bg-gray-100">
          {parsed.whatYouWillLearn.length} outcomes
        </span>
      </div>

      <p className="text-sm font-medium">View course details →</p>
    </Link>
  );
}