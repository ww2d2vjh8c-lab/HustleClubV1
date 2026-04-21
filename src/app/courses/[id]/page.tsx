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

/* ================= HELPERS ================= */

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

/* ================= SERVER ACTION ================= */

async function enrollCourse(formData: FormData) {
  "use server";
  const courseId = Number(formData.get("courseId"));
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: existing } = await supabase.from("course_enrollments").select("id").eq("course_id", courseId).eq("user_id", user.id).single();
  if (!existing) {
    await supabase.from("course_enrollments").insert({ course_id: courseId, user_id: user.id });
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
    .select("id, title, description, instructor, image_url, created_at, status, price")
    .eq("id", Number(id))
    .eq("status", "published")
    .single<Course>();

  if (error || !course) notFound();

  const parsed = parseCourseDescription(course.description);
  const isFree = !course.price || Number(course.price) === 0;

  let isOwner = false;
  if (user && course.instructor) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    isOwner = userProfile?.username === course.instructor;
  }

  const [enrollmentResult, enrolledCountResult, relatedResult] = await Promise.all([
    user
      ? supabase
          .from("course_enrollments")
          .select("id")
          .eq("course_id", course.id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("course_enrollments")
      .select("id", { head: true, count: "exact" })
      .eq("course_id", course.id),
    course.instructor
      ? supabase
          .from("courses")
          .select("id, title, price, instructor, image_url")
          .eq("instructor", course.instructor)
          .eq("status", "published")
          .neq("id", course.id)
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  const isEnrolled = !!enrollmentResult.data;
  const enrolledCount = enrolledCountResult.count ?? 0;
  const relatedCourses = relatedResult.data ?? [];

  const instructorInitials =
    (course.instructor ?? "?")
      .split(/[._-]/)
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "C";

  return (
    <main className="app-container" style={{ paddingBottom: "5rem" }}>

      {/* ── OWNER BANNER ── */}
      {isOwner && (
        <div
          style={{
            margin: "1rem 0",
            padding: ".65rem 1.25rem",
            background: "rgba(255,102,0,.08)",
            border: "1px solid rgba(255,102,0,.2)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: ".5rem",
          }}
        >
          <span
            className="mono"
            style={{ fontSize: ".7rem", letterSpacing: ".15em", color: "var(--neon-orange)" }}
          >
            ▸ YOUR COURSE
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span
              className="mono"
              style={{ fontSize: ".65rem", color: "var(--text-1)" }}
            >
              {enrolledCount} learner{enrolledCount !== 1 ? "s" : ""} enrolled
            </span>
            <Link
              href="/creator/courses"
              className="btn-ghost btn-sm"
              style={{ fontSize: ".7rem" }}
            >
              MANAGE COURSES →
            </Link>
          </div>
        </div>
      )}

      {/* ── BACK LINK ── */}
      <div style={{ marginBottom: "1.5rem", marginTop: isOwner ? ".5rem" : "1rem" }}>
        <Link
          href="/courses"
          className="mono"
          style={{
            fontSize: ".7rem",
            letterSpacing: ".1em",
            color: "var(--text-2)",
            transition: "color 140ms ease",
          }}
        >
          ← Back to Courses
        </Link>
      </div>

      {/* ── HERO ── */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "380px",
          borderRadius: "var(--radius)",
          overflow: "hidden",
          marginBottom: "2rem",
          border: "1px solid var(--line)",
          background:
            "linear-gradient(135deg, #1a0d00 0%, #00001a 50%, #001a0d 100%)",
        }}
      >
        {course.image_url && (
          <Image
            src={course.image_url}
            alt={course.title}
            fill
            sizes="1120px"
            style={{ objectFit: "cover", opacity: 0.55 }}
          />
        )}

        {/* top-to-bottom darkening overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(7,7,15,.15) 0%, rgba(7,7,15,.55) 60%, rgba(7,7,15,.88) 100%)",
          }}
        />

        {/* bottom-left content */}
        <div
          style={{
            position: "absolute",
            bottom: "1.75rem",
            left: "1.75rem",
            right: "1.75rem",
          }}
        >
          <span className="tag tag-orange" style={{ marginBottom: ".6rem" }}>
            COURSE
          </span>
          <h1
            className="display"
            style={{
              fontSize: "clamp(1.8rem, 4.5vw, 2.8rem)",
              color: "var(--text-0)",
              marginTop: ".4rem",
              marginBottom: ".4rem",
              lineHeight: 1.1,
              textShadow: "0 2px 24px rgba(0,0,0,.7)",
              maxWidth: "780px",
            }}
          >
            {course.title}
          </h1>
          {course.instructor && (
            <span
              className="mono"
              style={{ fontSize: ".72rem", color: "var(--text-1)", letterSpacing: ".08em" }}
            >
              by{" "}
              <span style={{ color: "var(--neon-orange)" }}>
                @{course.instructor}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── TWO-COLUMN GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "2rem",
          alignItems: "start",
        }}
      >
        {/* ────────── LEFT ────────── */}
        <section>

          {/* A) INSTRUCTOR CARD */}
          {course.instructor && (
            <div
              className="app-card"
              style={{
                borderLeft: "3px solid var(--neon-orange)",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--neon-orange), rgba(255,200,0,.5))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-display), 'Bebas Neue', cursive",
                  fontSize: "1.1rem",
                  color: "#000",
                  letterSpacing: ".05em",
                }}
              >
                {instructorInitials}
              </div>

              {/* Name + link */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="display"
                  style={{ fontSize: ".8rem", color: "var(--text-1)", marginBottom: ".15rem" }}
                >
                  Creator &amp; Instructor
                </div>
                <Link
                  href={"/u/" + course.instructor}
                  style={{
                    color: "var(--neon-orange)",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: ".8rem",
                    letterSpacing: ".06em",
                    transition: "text-shadow 140ms ease",
                  }}
                >
                  @{course.instructor}
                </Link>
              </div>

              {/* Published / daysAgo */}
              <div
                className="mono"
                style={{
                  fontSize: ".6rem",
                  color: "var(--text-2)",
                  letterSpacing: ".08em",
                  textAlign: "right",
                  flexShrink: 0,
                  lineHeight: 1.6,
                }}
              >
                PUBLISHED
                <br />
                {daysAgo(course.created_at)}
              </div>
            </div>
          )}

          {/* B) META TAGS */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".4rem",
              marginBottom: "1.5rem",
            }}
          >
            {isFree ? (
              <span className="tag tag-green">FREE</span>
            ) : (
              <span className="tag tag-orange">
                ₹{Number(course.price).toLocaleString()}
              </span>
            )}
            <span className="tag tag-green">{enrolledCount} enrolled</span>
            {parsed.whatYouWillLearn.length > 0 && (
              <span className="tag tag-muted">
                {parsed.whatYouWillLearn.length} outcome
                {parsed.whatYouWillLearn.length !== 1 ? "s" : ""}
              </span>
            )}
            {parsed.curriculum.length > 0 && (
              <span className="tag tag-muted">
                {parsed.curriculum.length} lesson
                {parsed.curriculum.length !== 1 ? "s" : ""}
              </span>
            )}
            <span className="tag tag-muted">Self-paced</span>
          </div>

          {/* C) SUMMARY */}
          {parsed.summary && (
            <p
              style={{
                color: "var(--text-1)",
                fontSize: ".95rem",
                lineHeight: 1.75,
                marginBottom: "2rem",
                maxWidth: "640px",
              }}
            >
              {parsed.summary}
            </p>
          )}

          {/* D) SECTIONS */}
          <CourseSection
            title="What You Will Learn"
            items={parsed.whatYouWillLearn}
            accentColor="var(--neon-orange)"
          />
          <CourseSection
            title="Curriculum"
            items={parsed.curriculum}
            accentColor="var(--neon-cyan)"
          />
          <CourseSection
            title="Who This Is For"
            items={parsed.whoIsThisFor}
            accentColor="var(--neon-green)"
          />
          <CourseSection
            title="Requirements"
            items={parsed.requirements}
            accentColor="var(--text-2)"
          />

          {/* E) ACTIVITY BAR */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".5rem 1.5rem",
              marginTop: "2rem",
              padding: "1rem 1.25rem",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            {[
              { icon: "🎓", text: `${enrolledCount} learners enrolled` },
              { icon: "🗓", text: `Published ${daysAgo(course.created_at)}` },
              { icon: "♾️", text: "Lifetime access" },
              { icon: "🚀", text: "Learn at your own pace" },
            ].map(({ icon, text }) => (
              <div
                key={text}
                className="mono"
                style={{
                  fontSize: ".68rem",
                  letterSpacing: ".06em",
                  color: "var(--text-1)",
                  display: "flex",
                  alignItems: "center",
                  gap: ".4rem",
                }}
              >
                <span style={{ fontSize: ".85rem" }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* ────────── RIGHT SIDEBAR ────────── */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <div
            className="app-card"
            style={{ borderTop: "2px solid var(--neon-orange)", padding: "1.5rem" }}
          >
            {/* Label */}
            <div
              className="mono"
              style={{
                fontSize: ".58rem",
                letterSpacing: ".15em",
                textTransform: "uppercase",
                color: "var(--text-2)",
                marginBottom: ".5rem",
              }}
            >
              Course Access
            </div>

            {/* Price */}
            <div
              className="display"
              style={{
                fontSize: "2rem",
                letterSpacing: ".04em",
                color: isFree ? "var(--neon-green)" : "var(--neon-orange)",
                marginBottom: ".25rem",
                textShadow: isFree
                  ? "0 0 16px rgba(0,232,122,.35)"
                  : "0 0 16px rgba(255,102,0,.35)",
              }}
            >
              {isFree ? "FREE" : `₹${Number(course.price).toLocaleString()}`}
            </div>

            {/* Enrolled count */}
            <p
              className="mono"
              style={{
                fontSize: ".65rem",
                color: "var(--text-1)",
                letterSpacing: ".06em",
                marginBottom: "1rem",
              }}
            >
              {enrolledCount} learners already enrolled
            </p>

            {/* Feature bullets */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".4rem",
                marginBottom: "1.25rem",
              }}
            >
              {[
                "Lifetime access",
                "Creator support",
                "Learn at your own pace",
                "Certificate on completion",
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                    fontSize: ".8rem",
                    color: "var(--text-1)",
                  }}
                >
                  <span style={{ color: "var(--neon-green)", fontSize: ".7rem" }}>
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>

            {/* CTA state machine */}
            {isOwner ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                <Link
                  href="/creator/courses"
                  className="btn-ghost"
                  style={{ display: "block", textAlign: "center", fontSize: ".8rem" }}
                >
                  MANAGE COURSE →
                </Link>
                <div
                  className="mono"
                  style={{
                    textAlign: "center",
                    fontSize: ".6rem",
                    color: "var(--text-2)",
                    letterSpacing: ".08em",
                  }}
                >
                  {enrolledCount} learner{enrolledCount !== 1 ? "s" : ""} enrolled
                </div>
              </div>
            ) : isEnrolled ? (
              <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
                <div
                  style={{
                    padding: ".6rem 1rem",
                    borderRadius: "var(--radius-sm)",
                    textAlign: "center",
                    background: "rgba(0,232,122,.08)",
                    border: "1px solid rgba(0,232,122,.25)",
                    color: "var(--neon-green)",
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: ".72rem",
                    letterSpacing: ".1em",
                  }}
                >
                  ✓ ENROLLED
                </div>
                <Link
                  href={`/learn/${course.id}`}
                  className="btn-neon-solid"
                  style={{ display: "block", textAlign: "center" }}
                >
                  CONTINUE LEARNING →
                </Link>
              </div>
            ) : !user ? (
              <Link
                href="/login"
                className="btn-neon-solid"
                style={{ display: "block", textAlign: "center" }}
              >
                LOGIN TO ENROLL
              </Link>
            ) : (
              <form action={enrollCourse}>
                <input type="hidden" name="courseId" value={course.id} />
                <button
                  type="submit"
                  className="btn-neon-solid"
                  style={{ width: "100%", cursor: "pointer" }}
                >
                  {isFree ? "ENROLL FREE →" : "BUY & ENROLL →"}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      {/* ── MORE FROM INSTRUCTOR ── */}
      {relatedCourses.length > 0 && (
        <section style={{ marginTop: "4rem" }}>
          {/* Eyebrow */}
          <div className="section-tag" style={{ marginBottom: ".5rem" }}>
            MORE FROM @{course.instructor}
          </div>
          <h2
            className="section-title"
            style={{ marginBottom: "1.5rem" }}
          >
            OTHER COURSES
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "1.25rem",
            }}
          >
            {relatedCourses.map(
              (rc: {
                id: number;
                title: string;
                price: number | null;
                instructor: string | null;
                image_url: string | null;
              }) => {
                const rcFree = !rc.price || Number(rc.price) === 0;
                return (
                  <Link
                    key={rc.id}
                    href={`/courses/${rc.id}`}
                    className="app-card card-lift"
                    style={{ display: "block", overflow: "hidden" }}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{
                        position: "relative",
                        height: "140px",
                        background:
                          "linear-gradient(135deg, #1a0d00 0%, #00001a 50%, #001a0d 100%)",
                      }}
                    >
                      {rc.image_url && (
                        <Image
                          src={rc.image_url}
                          alt={rc.title}
                          fill
                          sizes="300px"
                          style={{ objectFit: "cover", opacity: 0.6 }}
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to bottom, transparent 40%, rgba(7,7,15,.75) 100%)",
                        }}
                      />
                    </div>

                    {/* Card body */}
                    <div style={{ padding: ".9rem 1rem" }}>
                      <div
                        style={{
                          fontSize: ".82rem",
                          color: "var(--text-0)",
                          fontWeight: 600,
                          lineHeight: 1.4,
                          marginBottom: ".45rem",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {rc.title}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: ".72rem",
                          letterSpacing: ".06em",
                          color: rcFree
                            ? "var(--neon-green)"
                            : "var(--neon-orange)",
                        }}
                      >
                        {rcFree ? "FREE" : `₹${Number(rc.price).toLocaleString()}`}
                      </div>
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        </section>
      )}
    </main>
  );
}

/* ================= COURSE SECTION ================= */

function CourseSection({
  title,
  items,
  accentColor,
}: {
  title: string;
  items: string[];
  accentColor: string;
}) {
  if (!items?.length) return null;
  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <h2
        className="display"
        style={{
          fontSize: "1.05rem",
          letterSpacing: ".08em",
          color: "var(--text-0)",
          textTransform: "uppercase",
          marginBottom: ".75rem",
          paddingBottom: ".4rem",
          borderBottom: "1px solid var(--line)",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: ".6rem",
              padding: ".6rem .8rem",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
              fontSize: ".875rem",
              color: "var(--text-1)",
              lineHeight: 1.55,
            }}
          >
            <span
              style={{
                color: accentColor,
                fontSize: ".65rem",
                marginTop: ".2rem",
                flexShrink: 0,
              }}
            >
              ▸
            </span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
