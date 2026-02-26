import { requireAdmin } from "@/lib/supabase/auth";
import { deleteCourse, setCourseStatus } from "./actions";

export const dynamic = "force-dynamic";

type CourseRow = {
  id: number;
  title: string;
  status: string;
  created_at: string;
  creator_id: string;
};

export default async function AdminCoursesPage() {
  const { supabase } = await requireAdmin();

  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      status,
      created_at,
      creator_id
    `)
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<CourseRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load courses.</p>
      </main>
    );
  }

  const creatorIds = [...new Set((courses ?? []).map((course) => course.creator_id).filter(Boolean))];
  const { data: creators } = creatorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, email")
        .in("id", creatorIds)
    : { data: [] as { id: string; username: string | null; full_name: string | null; email: string | null }[] };

  const creatorById = new Map((creators ?? []).map((creator) => [creator.id, creator]));

  const published = courses?.filter((course) => course.status === "published").length ?? 0;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Courses Moderation</h1>
        <p className="text-sm text-slate-600">
          Review all courses, control publication status, and remove non-compliant content.
        </p>
      </header>

      <section className="app-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Total Courses" value={courses?.length ?? 0} />
        <Metric label="Published" value={published} />
        <Metric label="Draft" value={(courses?.length ?? 0) - published} />
        <Metric
          label="Creators With Courses"
          value={new Set((courses ?? []).map((course) => course.creator_id).filter(Boolean)).size}
        />
      </section>

      <section className="space-y-3">
        {courses?.map((course) => {
          const creator = creatorById.get(course.creator_id);
          const isPublished = course.status === "published";
          return (
            <article key={course.id} className="app-card rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{course.title}</p>
                  <p className="text-sm text-slate-600">
                    By {creator?.full_name || creator?.username || creator?.email || "Unknown"} ·{" "}
                    {new Date(course.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    Status:{" "}
                    <span className={isPublished ? "text-emerald-700" : "text-slate-700"}>
                      {course.status}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await setCourseStatus(String(course.id), isPublished ? "draft" : "published");
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50">
                      {isPublished ? "Unpublish" : "Publish"}
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await deleteCourse(String(course.id));
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 text-sm hover:bg-rose-50">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}

        {courses?.length === 0 ? (
          <div className="app-card rounded-xl p-6 text-slate-500">No courses found.</div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
