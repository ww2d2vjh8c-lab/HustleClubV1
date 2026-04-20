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
    <main className="app-container" style={{ paddingBottom: "5rem" }}>

      {/* ── BACK LINK ── */}
      <div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
        <Link href="/courses" style={{
          fontFamily: "var(--font-mono), monospace", fontSize: ".7rem",
          letterSpacing: ".1em", color: "var(--text-2)", textDecoration: "none",
        }}>
          ← Back to Courses
        </Link>
      </div>

      {/* ── HERO IMAGE ── */}
      {course.image_url && (
        <div style={{
          position: "relative", width: "100%", height: "320px",
          borderRadius: "var(--radius)", overflow: "hidden",
          marginBottom: "2rem", border: "1px solid var(--line)",
        }}>
          <Image src={course.image_url} alt={course.title} fill sizes="1200px" style={{ objectFit: "cover" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(7,7,15,.8) 0%, transparent 60%)",
          }} />
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: "2rem",
        alignItems: "start",
      }}>

        {/* ── LEFT: CONTENT ── */}
        <section>
          {/* Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            {course.instructor && (
              <span style={{ fontSize: ".72rem", color: "var(--neon-orange)", display: "block", marginBottom: ".35rem" }}>
                @{course.instructor}
              </span>
            )}
            <h1 className="display" style={{
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)", letterSpacing: ".04em",
              color: "var(--text-0)", marginBottom: ".5rem", lineHeight: 1.15,
            }}>
              {course.title}
            </h1>
            <p className="mono" style={{ fontSize: ".65rem", color: "var(--text-2)", letterSpacing: ".1em" }}>
              Published {new Date(course.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Summary */}
          {(parsed.summary) && (
            <p style={{
              color: "var(--text-1)", fontSize: ".95rem", lineHeight: 1.75,
              marginBottom: "2rem", maxWidth: "640px",
            }}>
              {parsed.summary}
            </p>
          )}

          {/* Content sections */}
          <CourseSection title="What You Will Learn" items={parsed.whatYouWillLearn} accentColor="var(--neon-orange)" />
          <CourseSection title="Curriculum" items={parsed.curriculum} accentColor="var(--neon-cyan)" />
          <CourseSection title="Who This Is For" items={parsed.whoIsThisFor} accentColor="var(--neon-green)" />
          <CourseSection title="Requirements" items={parsed.requirements} accentColor="var(--text-2)" />
        </section>

        {/* ── RIGHT: SIDEBAR ── */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <div className="app-card" style={{ borderTop: "2px solid var(--neon-orange)", padding: "1.5rem" }}>
            <div style={{
              fontFamily: "var(--font-mono), monospace", fontSize: ".58rem",
              letterSpacing: ".15em", textTransform: "uppercase",
              color: "var(--text-2)", marginBottom: ".5rem",
            }}>
              Course Access
            </div>

            <div style={{
              fontFamily: "var(--font-display), cursive",
              fontSize: "2rem", letterSpacing: ".04em",
              color: "var(--neon-green)", marginBottom: ".25rem",
              textShadow: "0 0 16px rgba(0,232,122,.35)",
            }}>
              {isFree ? "FREE" : `₹${Number(course.price).toLocaleString()}`}
            </div>

            <p style={{ fontSize: ".78rem", color: "var(--text-1)", marginBottom: "1rem" }}>
              {enrolledCount ?? 0} learners enrolled
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginBottom: "1.25rem" }}>
              {["Lifetime access", "Creator support", "Learn at your own pace"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".8rem", color: "var(--text-1)" }}>
                  <span style={{ color: "var(--neon-green)", fontSize: ".7rem" }}>✓</span>
                  {f}
                </div>
              ))}
            </div>

            {!user ? (
              <Link href="/login" className="btn-neon-solid" style={{ display: "block", textAlign: "center" }}>
                LOGIN TO ENROLL
              </Link>
            ) : isEnrolled ? (
              <div style={{
                padding: ".6rem 1rem", borderRadius: "var(--radius-sm)", textAlign: "center",
                background: "rgba(0,232,122,.08)", border: "1px solid rgba(0,232,122,.25)",
                color: "var(--neon-green)", fontFamily: "var(--font-mono), monospace",
                fontSize: ".72rem", letterSpacing: ".1em",
              }}>
                ✓ ENROLLED
              </div>
            ) : (
              <form action={enrollCourse}>
                <input type="hidden" name="courseId" value={course.id} />
                <button type="submit" className="btn-neon-solid" style={{ width: "100%", cursor: "pointer" }}>
                  {isFree ? "ENROLL FREE →" : "BUY & ENROLL →"}
                </button>
              </form>
            )}

            {isEnrolled && (
              <Link href={`/learn/${course.id}`} className="btn-ghost" style={{
                display: "block", textAlign: "center", marginTop: ".75rem", fontSize: ".8rem",
              }}>
                CONTINUE LEARNING →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function CourseSection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <h2 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.1rem", letterSpacing: ".06em",
        color: "var(--text-0)", marginBottom: ".75rem",
        paddingBottom: ".4rem", borderBottom: `1px solid var(--line)`,
      }}>
        {title.toUpperCase()}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: ".6rem",
            padding: ".6rem .8rem",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            fontSize: ".875rem", color: "var(--text-1)", lineHeight: 1.55,
          }}>
            <span style={{ color: accentColor, fontSize: ".65rem", marginTop: ".2rem", flexShrink: 0 }}>▸</span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
