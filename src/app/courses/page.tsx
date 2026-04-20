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
  searchParams?: Promise<{ q?: string; sort?: string }>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const supabase = await createSupabaseServerClient();
  const { q: rawQ, sort: rawSort } = (await searchParams) ?? {};
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
      <main className="app-container" style={{ paddingBottom: "4rem" }}>
        <div style={{
          textAlign: "center", padding: "5rem 2rem",
          border: "1px solid var(--line)", borderRadius: "var(--radius)",
          background: "var(--surface-strong)",
        }}>
          <div className="display" style={{ fontSize: "2rem", color: "var(--neon-pink)" }}>FAILED TO LOAD</div>
          <p className="text-dim mono" style={{ fontSize: ".8rem", marginTop: ".75rem" }}>
            Could not fetch courses — try again
          </p>
        </div>
      </main>
    );
  }

  // ── Build enrollment map ─────────────────────────────────
  const courseIds = courses?.map((c) => c.id) ?? [];
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

  // ── Determine featured course (highest enrollment) ───────
  const list = courses ?? [];
  let featuredCourse: Course | null = null;
  let gridCourses: Course[] = list;

  if (list.length > 0) {
    const maxEnrollment = Math.max(...list.map((c) => enrollmentMap[c.id] ?? 0));
    if (maxEnrollment > 0) {
      const featuredIdx = list.findIndex(
        (c) => (enrollmentMap[c.id] ?? 0) === maxEnrollment
      );
      featuredCourse = list[featuredIdx];
      gridCourses = list.filter((_, i) => i !== featuredIdx);
    }
  }

  return (
    <main className="app-container" style={{ paddingBottom: "4rem" }}>

      {/* ─── PAGE HEADER ────────────────────────────────────── */}
      <div className="page-header">
        <p className="section-tag" style={{ marginBottom: ".4rem" }}>Knowledge</p>
        <h1 className="page-title">
          THE <span className="accent-orange">COURSES</span>
        </h1>
        <p className="page-subtitle">Learn real skills from verified creators. Enroll in seconds.</p>
      </div>

      {/* ─── SEARCH BAR ─────────────────────────────────────── */}
      <form style={{ display: "flex", gap: ".5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search courses, creators, topics..."
          className="field-input"
          style={{ flex: "1", minWidth: "200px" }}
        />
        <select
          name="sort"
          defaultValue={sort}
          className="field-input"
          style={{ width: "auto", minWidth: "160px", cursor: "pointer" }}
        >
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low → High</option>
          <option value="price_high">Price: High → Low</option>
        </select>
        <button type="submit" className="btn-neon">SEARCH</button>
      </form>

      {/* ─── EMPTY STATE ────────────────────────────────────── */}
      {list.length === 0 && (
        <div style={{
          textAlign: "center", padding: "5rem 2rem",
          border: "1px solid var(--line)", borderRadius: "var(--radius)",
          background: "var(--surface-strong)",
        }}>
          <div className="display" style={{ fontSize: "2.5rem", color: "var(--text-2)", letterSpacing: ".08em" }}>
            NO COURSES YET
          </div>
          <p className="text-dim mono" style={{ fontSize: ".8rem", letterSpacing: ".05em", marginTop: ".75rem" }}>
            {q ? `No results for "${q}"` : "Check back soon — creators are building"}
          </p>
        </div>
      )}

      {/* ─── FEATURED COURSE (most enrolled) ───────────────── */}
      {featuredCourse && (
        <>
          <div style={{ marginBottom: ".65rem" }}>
            <span className="mono text-dim" style={{ fontSize: ".6rem", letterSpacing: ".18em", textTransform: "uppercase" }}>
              ⭐ Most enrolled
            </span>
          </div>
          <FeaturedCourseCard
            course={featuredCourse}
            enrollmentCount={enrollmentMap[featuredCourse.id] ?? 0}
          />
        </>
      )}

      {/* ─── COURSE GRID ────────────────────────────────────── */}
      {gridCourses.length > 0 && (
        <>
          <div style={{
            marginTop: "1.5rem", marginBottom: ".65rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span className="mono text-dim" style={{ fontSize: ".6rem", letterSpacing: ".18em", textTransform: "uppercase" }}>
              All courses
            </span>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}>
            {gridCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                enrollmentCount={enrollmentMap[course.id] ?? 0}
              />
            ))}
          </div>
        </>
      )}

    </main>
  );
}

// ── FEATURED WIDE CARD ──────────────────────────────────────

function FeaturedCourseCard({
  course,
  enrollmentCount,
}: {
  course: Course;
  enrollmentCount: number;
}) {
  const parsed = parseCourseDescription(course.description);
  const summary = parsed.summary || "A comprehensive course to build real skills.";
  const lessonCount = parsed.curriculum.length || parsed.whatYouWillLearn.length;
  const outcomeCount = parsed.whatYouWillLearn.length;
  const isFree = !course.price || Number(course.price) === 0;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="app-card"
      style={{
        display: "flex",
        overflow: "hidden",
        textDecoration: "none",
        borderTop: "2px solid var(--neon-orange)",
        transition: "border-color 200ms, transform 180ms, box-shadow 200ms",
      }}
    >
      {/* Left: image column */}
      <div style={{
        width: "220px",
        flexShrink: 0,
        background: "linear-gradient(135deg, #1a0800, var(--bg-1))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "3rem",
        borderRight: "1px solid var(--line)",
        position: "relative",
        overflow: "hidden",
      }}>
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            style={{ objectFit: "cover" }}
            sizes="220px"
          />
        ) : (
          <span style={{ color: "var(--text-2)" }}>
            {course.title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Right: body */}
      <div style={{
        flex: 1,
        padding: "1.25rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}>
        <div>
          {/* Featured badge */}
          <div style={{
            display: "inline-flex", alignItems: "center",
            fontFamily: "var(--font-mono), monospace",
            fontSize: ".6rem", letterSpacing: ".1em", textTransform: "uppercase",
            color: "var(--neon-orange)",
            background: "rgba(255,102,0,.1)",
            border: "1px solid rgba(255,102,0,.3)",
            borderRadius: "3px",
            padding: ".15rem .5rem",
            marginBottom: ".6rem",
          }}>
            ★ Featured · {enrollmentCount} students
          </div>

          {/* Title */}
          <h2 className="display" style={{
            fontSize: "1.4rem", letterSpacing: ".04em",
            color: "var(--text-0)", marginBottom: ".3rem",
          }}>
            {course.title}
          </h2>

          {/* Instructor link */}
          {course.instructor && (
            <span style={{ fontSize: ".72rem", color: "var(--neon-orange)" }}>
              @{course.instructor}
            </span>
          )}

          {/* Description */}
          <p style={{
            color: "var(--text-1)", fontSize: ".82rem", lineHeight: 1.6,
            margin: ".5rem 0 .85rem",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {summary}
          </p>

          {/* Pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".35rem" }}>
            {lessonCount > 0 && (
              <span className="tag tag-muted">{lessonCount} lessons</span>
            )}
            {outcomeCount > 0 && (
              <span className="tag tag-cyan">{outcomeCount} outcomes</span>
            )}
            <span className="tag tag-muted">Self-paced</span>
          </div>
        </div>

        {/* Footer: price + CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: ".9rem" }}>
          <span style={{
            fontFamily: "var(--font-display), cursive",
            fontSize: "1.3rem", letterSpacing: ".04em",
            color: "var(--neon-green)",
            textShadow: "0 0 8px rgba(0,232,122,.4)",
          }}>
            {isFree ? "FREE" : `₹${Number(course.price).toLocaleString()}`}
          </span>
          <span
            className="btn-neon-solid btn-sm"
            style={{ pointerEvents: "none" }}
          >
            ENROLL NOW →
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── REGULAR COURSE CARD ─────────────────────────────────────

function CourseCard({
  course,
  enrollmentCount,
}: {
  course: Course;
  enrollmentCount: number;
}) {
  const isFree = !course.price || Number(course.price) === 0;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="app-card card-lift"
      style={{ display: "block", overflow: "hidden", textDecoration: "none" }}
    >
      {/* Image */}
      <div style={{
        width: "100%", aspectRatio: "16/9",
        background: "var(--bg-1)", overflow: "hidden",
        position: "relative", borderBottom: "1px solid var(--line)",
      }}>
        {course.image_url ? (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="display" style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", color: "var(--text-2)",
            background: "linear-gradient(135deg, var(--bg-1), var(--bg-2))",
          }}>
            {course.title.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: ".85rem 1rem 1rem" }}>
        <h3 className="display" style={{
          fontSize: "1.05rem", letterSpacing: ".04em",
          color: "var(--text-0)", marginBottom: ".25rem",
        }}>
          {course.title}
        </h3>

        {course.instructor && (
          <span style={{ fontSize: ".72rem", color: "var(--neon-orange)" }}>
            @{course.instructor}
          </span>
        )}

        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", marginTop: ".65rem",
        }}>
          <span style={{
            fontFamily: "var(--font-display), cursive",
            fontSize: "1.1rem",
            color: "var(--neon-green)",
            textShadow: "0 0 8px rgba(0,232,122,.3)",
          }}>
            {isFree ? "FREE" : `₹${Number(course.price).toLocaleString()}`}
          </span>
          {enrollmentCount > 0 && (
            <span className="tag tag-muted">{enrollmentCount} enrolled</span>
          )}
        </div>
      </div>
    </Link>
  );
}
