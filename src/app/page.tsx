import Link from "next/link";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCourseDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

// ── Time helper (no external lib) ──────────────────────────
function timeSince(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  // ── Parallel queries for live feed ─────────────────────
  const [courseRes, jobRes, itemRes] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, description, instructor, image_url, price, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("jobs")
      .select("id, title, description, budget, type, creator_id, created_at")
      .eq("is_open", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("marketplace_items")
      .select("id, title, description, price, image_url, created_at")
      .eq("is_published", true)
      .eq("is_sold", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const latestCourse = courseRes.data;
  const latestJob = jobRes.data;
  const latestItem = itemRes.data;

  // ── Count queries (run after we know what exists) ───────
  const [enrollCountRes, applyCountRes, soldCountRes, jobCreatorRes] =
    await Promise.all([
      latestCourse
        ? supabase
            .from("course_enrollments")
            .select("*", { count: "exact", head: true })
            .eq("course_id", latestCourse.id)
        : Promise.resolve({ count: 0 as number | null, error: null }),
      latestJob
        ? supabase
            .from("job_applications")
            .select("*", { count: "exact", head: true })
            .eq("job_id", latestJob.id)
        : Promise.resolve({ count: 0 as number | null, error: null }),
      latestItem
        ? supabase
            .from("marketplace_orders")
            .select("*", { count: "exact", head: true })
            .eq("item_id", latestItem.id)
        : Promise.resolve({ count: 0 as number | null, error: null }),
      latestJob
        ? supabase
            .from("profiles")
            .select("username, avatar_url, full_name")
            .eq("id", latestJob.creator_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

  const courseEnrollmentCount = enrollCountRes.count ?? 0;
  const jobApplicationCount = applyCountRes.count ?? 0;
  const itemSoldCount = soldCountRes.count ?? 0;
  const jobCreator = jobCreatorRes.data ?? null;

  const showLiveFeed = latestCourse || latestJob || latestItem;

  return (
    <main style={{ paddingBottom: "6rem" }}>

      {/* ─── HERO ──────────────────────────────────── */}
      <section style={{
        padding: "5rem 0 4.5rem",
        borderBottom: "1px solid var(--line)",
      }}>
        <div className="app-container">
          <div style={{ maxWidth: "680px" }}>
            <p className="section-tag" style={{ marginBottom: "1.25rem" }}>
              Creator Economy Platform
            </p>

            <h1 className="display" style={{
              fontSize: "clamp(3.2rem, 9vw, 7rem)",
              color: "var(--text-0)",
              marginBottom: ".75rem",
            }}>
              BUILD YOUR<br />
              <span style={{
                color: "var(--neon-orange)",
                textShadow: "var(--glow-orange)",
              }}>HUSTLE.</span>
            </h1>

            <p style={{
              fontSize: "1.1rem",
              color: "var(--text-1)",
              lineHeight: 1.65,
              maxWidth: "520px",
              marginBottom: "2.25rem",
            }}>
              One platform to learn new skills, land paid gigs, and sell your
              digital work. No gatekeepers. Start for free.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", alignItems: "center" }}>
              <Link href="/signup" className="btn-neon-solid btn-lg">
                JOIN FOR FREE →
              </Link>
              <Link href="/jobs" className="btn-ghost btn-lg">
                BROWSE JOBS
              </Link>
            </div>
          </div>

          {/* Stat strip */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2.5rem",
            marginTop: "3.5rem",
            paddingTop: "2.5rem",
            borderTop: "1px solid var(--line)",
          }}>
            {[
              { num: "3", label: "Revenue channels" },
              { num: "Free", label: "To get started" },
              { num: "Live", label: "Real deployments" },
            ].map((s) => (
              <div key={s.label}>
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THREE WAYS TO EARN ────────────────────── */}
      <section style={{ padding: "4rem 0" }}>
        <div className="app-container">
          <div style={{ marginBottom: "2.25rem" }}>
            <p className="section-tag">What you can do</p>
            <h2 className="section-title">
              THREE WAYS TO{" "}
              <span className="accent-orange">GET PAID</span>
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}>
            <ChannelCard
              num="01"
              title="COURSES"
              body="Publish what you know. Buyers enroll, you get paid. Full creator dashboard with analytics."
              href="/courses"
              cta="Explore courses"
              accentClass="accent-orange"
              hoverClass="card-lift"
            />
            <ChannelCard
              num="02"
              title="JOBS"
              body="Post a gig or find one. Apply in seconds. Track applications and manage your hiring pipeline."
              href="/jobs"
              cta="Browse jobs"
              accentClass="accent-cyan"
              hoverClass="card-lift card-lift-cyan"
            />
            <ChannelCard
              num="03"
              title="MARKETPLACE"
              body="Sell templates, presets, files — anything digital. List once, sell forever, instant delivery."
              href="/marketplace"
              cta="Visit market"
              accentClass="accent-pink"
              hoverClass="card-lift card-lift-pink"
            />
          </div>
        </div>
      </section>

      {/* ─── LIVE FEED (conditional) ─────────────────────── */}
      {showLiveFeed && (
        <LiveFeedSection
          latestCourse={latestCourse}
          latestJob={latestJob}
          latestItem={latestItem}
          courseEnrollmentCount={courseEnrollmentCount}
          jobApplicationCount={jobApplicationCount}
          itemSoldCount={itemSoldCount}
          jobCreator={jobCreator}
        />
      )}

      {/* ─── HOW IT WORKS ─────────────────────────── */}
      <section style={{
        padding: "4rem 0",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}>
        <div className="app-container">
          <div style={{ marginBottom: "2.25rem" }}>
            <p className="section-tag">Simple process</p>
            <h2 className="section-title">GET STARTED IN MINUTES</h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1px",
            background: "var(--line)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            overflow: "hidden",
          }}>
            {[
              { step: "01", title: "Create account", body: "Sign up free. No credit card needed to start." },
              { step: "02", title: "Choose your path", body: "Apply for jobs, enroll in a course, or browse the market." },
              { step: "03", title: "Build & earn", body: "Apply to become a creator. Publish, sell, and grow." },
            ].map((item) => (
              <div key={item.step} style={{
                padding: "1.75rem",
                background: "var(--surface-strong)",
              }}>
                <div className="mono" style={{
                  fontSize: ".68rem",
                  letterSpacing: ".2em",
                  color: "var(--neon-orange)",
                  marginBottom: ".75rem",
                }}>
                  STEP {item.step}
                </div>
                <h3 style={{
                  fontFamily: "var(--font-display), cursive",
                  fontSize: "1.3rem",
                  letterSpacing: ".05em",
                  color: "var(--text-0)",
                  marginBottom: ".6rem",
                }}>
                  {item.title.toUpperCase()}
                </h3>
                <p style={{ color: "var(--text-1)", fontSize: ".875rem", lineHeight: 1.65, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLES ────────────────────────────────── */}
      <section style={{ padding: "4rem 0" }}>
        <div className="app-container">
          <div style={{
            background: "var(--surface-strong)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: "2.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2.5rem",
            alignItems: "center",
          }}>
            <div>
              <p className="section-tag">Who it&apos;s for</p>
              <h2 className="section-title" style={{ marginBottom: ".75rem" }}>
                BUILT FOR EVERY{" "}
                <span className="accent-orange">PLAYER</span>
              </h2>
              <p style={{ color: "var(--text-1)", lineHeight: 1.65, marginBottom: "1.5rem", fontSize: ".95rem" }}>
                Whether you&apos;re here to learn, earn, or run the whole show —
                HustleClub has a role for you.
              </p>
              <Link href="/signup" className="btn-neon-solid">
                CREATE ACCOUNT →
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
              <RoleRow icon="👤" title="User" detail="Browse, enroll, apply, buy" />
              <RoleRow icon="🎨" title="Creator" detail="Publish courses, post jobs, sell goods" color="var(--neon-cyan)" />
              <RoleRow icon="⚡" title="Admin" detail="Approve, moderate, analyse" color="var(--neon-pink)" />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}

// ── LIVE FEED SECTION ───────────────────────────────────────

type LiveCourse = { id: number; title: string; description: string | null; instructor: string | null; image_url: string | null; price: number | null; created_at: string };
type LiveJob    = { id: number; title: string; description: string | null; budget: number | null; type: string | null; creator_id: string; created_at: string };
type LiveItem   = { id: string; title: string; description: string | null; price: number | null; image_url: string | null; created_at: string };
type JobCreator = { username: string | null; avatar_url: string | null; full_name: string | null } | null;

function LiveFeedSection({
  latestCourse,
  latestJob,
  latestItem,
  courseEnrollmentCount,
  jobApplicationCount,
  itemSoldCount,
  jobCreator,
}: {
  latestCourse: LiveCourse | null;
  latestJob: LiveJob | null;
  latestItem: LiveItem | null;
  courseEnrollmentCount: number;
  jobApplicationCount: number;
  itemSoldCount: number;
  jobCreator: JobCreator;
}) {
  // Static ticker items — no real-time events table needed
  const tickerItems = [
    "● Someone just enrolled in a course",
    "● New creator job posted",
    "● Digital item sold today",
    "● New creator joined the platform",
    "● Course enrollment happening now",
    "● Gig application submitted",
    "● New marketplace listing live",
  ];
  const tickerText = tickerItems.join("   ·   ");

  return (
    <section style={{
      borderTop: "1px solid var(--line)",
      borderBottom: "1px solid var(--line)",
    }}>
      <style>{`
        @keyframes hc-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes hc-live-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        .hc-live-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--neon-green);
          animation: hc-live-pulse 1.6s ease infinite;
          margin-right: .4rem;
          vertical-align: middle;
        }
        .hc-activity-dot {
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          animation: hc-live-pulse 2s ease infinite;
          flex-shrink: 0;
        }
      `}</style>

      {/* Ticker */}
      <div style={{
        overflow: "hidden",
        borderBottom: "1px solid var(--line)",
        background: "rgba(255,102,0,.025)",
        padding: ".32rem 0",
      }}>
        <div style={{
          display: "inline-flex",
          whiteSpace: "nowrap",
          animation: "hc-ticker 22s linear infinite",
        }}>
          {/* Duplicate for seamless loop */}
          {[tickerText, tickerText].map((t, i) => (
            <span key={i} style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".62rem",
              letterSpacing: ".07em",
              color: "var(--text-1)",
              opacity: 0.7,
              padding: "0 3rem",
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Section header + cards */}
      <div className="app-container" style={{ padding: "3rem 0" }}>
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: ".75rem",
          marginBottom: "1.5rem",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".62rem", letterSpacing: ".18em", textTransform: "uppercase",
              color: "var(--text-1)", marginBottom: ".3rem",
            }}>
              <span className="hc-live-dot" />
              Live on HustleClub
            </div>
            <h2 className="section-title" style={{ marginBottom: ".2rem" }}>
              PEOPLE ARE <span className="accent-orange">HUSTLING RIGHT NOW</span>
            </h2>
            <p style={{ color: "var(--text-1)", fontSize: ".82rem" }}>
              Join them — or watch what&apos;s possible.
            </p>
          </div>
          <div style={{ display: "flex", gap: ".35rem", alignItems: "center", paddingTop: ".25rem", flexWrap: "wrap" }}>
            <Link href="/courses" className="btn-ghost btn-sm" style={{ fontSize: ".72rem" }}>Courses →</Link>
            <Link href="/jobs"    className="btn-ghost btn-sm" style={{ fontSize: ".72rem" }}>Jobs →</Link>
            <Link href="/marketplace" className="btn-ghost btn-sm" style={{ fontSize: ".72rem" }}>Market →</Link>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1rem",
        }}>

          {/* ── COURSE CARD ── */}
          {latestCourse && (() => {
            const parsed = parseCourseDescription(latestCourse.description);
            const lessonCount = parsed.curriculum.length || parsed.whatYouWillLearn.length;
            const isFree = !latestCourse.price || Number(latestCourse.price) === 0;
            const initials = (latestCourse.instructor ?? latestCourse.title).slice(0, 1).toUpperCase();
            return (
              <Link href={`/courses/${latestCourse.id}`} className="app-card card-lift" style={{
                display: "block", textDecoration: "none", overflow: "hidden",
                borderTop: "2px solid var(--neon-orange)",
              }}>
                {/* Image */}
                <div style={{
                  width: "100%", aspectRatio: "16/9", position: "relative",
                  background: "linear-gradient(135deg, #1a0800, var(--bg-1))",
                  overflow: "hidden", borderBottom: "1px solid var(--line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2.5rem", color: "var(--text-2)",
                }}>
                  {latestCourse.image_url ? (
                    <Image src={latestCourse.image_url} alt={latestCourse.title} fill style={{ objectFit: "cover" }} sizes="33vw" />
                  ) : "🎓"}
                  {/* Activity badge */}
                  {courseEnrollmentCount > 0 && (
                    <div style={{
                      position: "absolute", top: ".5rem", right: ".5rem",
                      background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: "3px", padding: ".15rem .45rem",
                      fontFamily: "var(--font-mono), monospace", fontSize: ".58rem",
                      letterSpacing: ".06em", color: "var(--text-1)",
                      display: "flex", alignItems: "center", gap: ".3rem",
                      backdropFilter: "blur(4px)",
                    }}>
                      <span className="hc-activity-dot" style={{ background: "var(--neon-green)" }} />
                      {courseEnrollmentCount} enrolled
                    </div>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: ".85rem 1rem 1rem" }}>
                  {/* Creator row */}
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, var(--neon-orange), #ff3300)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".65rem", fontWeight: 800, color: "#000",
                    }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: ".72rem", color: "var(--neon-orange)" }}>
                      {latestCourse.instructor ? `@${latestCourse.instructor}` : "Creator"}
                    </span>
                    <span style={{
                      marginLeft: "auto", fontFamily: "var(--font-mono), monospace",
                      fontSize: ".62rem", color: "var(--text-2)",
                    }}>
                      {timeSince(latestCourse.created_at)}
                    </span>
                  </div>
                  {/* Title */}
                  <h3 className="display" style={{ fontSize: "1rem", letterSpacing: ".04em", color: "var(--text-0)", marginBottom: ".4rem" }}>
                    {latestCourse.title}
                  </h3>
                  {/* Proof pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginBottom: ".5rem" }}>
                    {courseEnrollmentCount > 10 && (
                      <span className="tag tag-muted">⭐ 4.9</span>
                    )}
                    {courseEnrollmentCount > 0 && (
                      <span className="tag tag-muted">👥 {courseEnrollmentCount} students</span>
                    )}
                    {lessonCount > 0 && (
                      <span className="tag tag-muted">📚 {lessonCount} lessons</span>
                    )}
                  </div>
                  {/* Static micro-quote */}
                  <p style={{
                    fontSize: ".72rem", color: "var(--text-1)", lineHeight: 1.5,
                    fontStyle: "italic",
                    borderLeft: "2px solid rgba(255,102,0,.3)", paddingLeft: ".55rem",
                    marginBottom: ".65rem",
                  }}>
                    {/* Static social proof copy — no review system yet */}
                    &ldquo;Changed how I pitch clients completely.&rdquo;
                  </p>
                  {/* Footer */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: ".6rem", borderTop: "1px solid var(--line)",
                  }}>
                    <span style={{ fontFamily: "var(--font-display), cursive", fontSize: "1rem", color: "var(--neon-green)", textShadow: "0 0 8px rgba(0,232,122,.3)" }}>
                      {isFree ? "FREE" : `₹${Number(latestCourse.price).toLocaleString()}`}
                    </span>
                    <span className="btn-neon btn-sm" style={{ fontSize: ".7rem", pointerEvents: "none" }}>
                      ENROLL NOW →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })()}

          {/* ── JOB CARD ── */}
          {latestJob && (() => {
            const creatorInitial = (jobCreator?.username ?? jobCreator?.full_name ?? "C").slice(0, 1).toUpperCase();
            const creatorName = jobCreator?.username ? `@${jobCreator.username}` : "Creator";
            return (
              <Link href={`/jobs/${latestJob.id}`} className="app-card card-lift card-lift-cyan" style={{
                display: "block", textDecoration: "none", overflow: "hidden",
                borderTop: "2px solid var(--neon-cyan)",
              }}>
                {/* Image placeholder */}
                <div style={{
                  width: "100%", aspectRatio: "16/9", position: "relative",
                  background: "linear-gradient(135deg, #001a1a, var(--bg-1))",
                  overflow: "hidden", borderBottom: "1px solid var(--line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2.5rem",
                }}>
                  💼
                  {/* Activity badge */}
                  {jobApplicationCount > 0 && (
                    <div style={{
                      position: "absolute", top: ".5rem", right: ".5rem",
                      background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)",
                      borderRadius: "3px", padding: ".15rem .45rem",
                      fontFamily: "var(--font-mono), monospace", fontSize: ".58rem",
                      letterSpacing: ".06em", color: "var(--text-1)",
                      display: "flex", alignItems: "center", gap: ".3rem",
                      backdropFilter: "blur(4px)",
                    }}>
                      <span className="hc-activity-dot" style={{ background: "var(--neon-orange)" }} />
                      {jobApplicationCount} applied
                    </div>
                  )}
                </div>
                {/* Body */}
                <div style={{ padding: ".85rem 1rem 1rem" }}>
                  {/* Creator row */}
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                    {jobCreator?.avatar_url ? (
                      <Image src={jobCreator.avatar_url} alt={creatorName} width={22} height={22} style={{ borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                        background: "linear-gradient(135deg, var(--neon-cyan), var(--neon-green))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: ".65rem", fontWeight: 800, color: "#000",
                      }}>
                        {creatorInitial}
                      </div>
                    )}
                    <span style={{ fontSize: ".72rem", color: "var(--neon-cyan)" }}>{creatorName}</span>
                    <span style={{
                      marginLeft: "auto", fontFamily: "var(--font-mono), monospace",
                      fontSize: ".62rem", color: "var(--text-2)",
                    }}>
                      {timeSince(latestJob.created_at)}
                    </span>
                  </div>
                  {/* Title */}
                  <h3 className="display" style={{ fontSize: "1rem", letterSpacing: ".04em", color: "var(--text-0)", marginBottom: ".4rem" }}>
                    {latestJob.title}
                  </h3>
                  {/* Proof pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginBottom: ".5rem" }}>
                    {latestJob.budget && (
                      <span className="tag tag-green">💰 ₹{latestJob.budget.toLocaleString()}</span>
                    )}
                    {latestJob.type && (
                      <span className="tag tag-orange">{latestJob.type}</span>
                    )}
                    <span className="tag tag-muted">🌍 Remote</span>
                  </div>
                  {/* Urgency strip */}
                  {jobApplicationCount > 0 && (
                    <div style={{
                      background: "rgba(255,102,0,.07)",
                      border: "1px solid rgba(255,102,0,.18)",
                      borderRadius: "3px", padding: ".22rem .55rem",
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: ".6rem", color: "var(--neon-orange)",
                      letterSpacing: ".06em", marginBottom: ".65rem",
                    }}>
                      ⚡ {jobApplicationCount} {jobApplicationCount === 1 ? "person" : "people"} already applied — move fast
                    </div>
                  )}
                  {/* Footer */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: ".6rem", borderTop: "1px solid var(--line)",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display), cursive", fontSize: "1rem",
                      color: "var(--neon-cyan)", textShadow: "0 0 8px rgba(0,238,255,.3)",
                    }}>
                      {latestJob.budget ? `₹${latestJob.budget.toLocaleString()}` : "Open"}
                    </span>
                    <span className="btn-neon btn-sm" style={{
                      fontSize: ".7rem", pointerEvents: "none",
                      borderColor: "var(--neon-cyan)", color: "var(--neon-cyan)",
                      background: "rgba(0,238,255,.06)",
                    }}>
                      APPLY NOW →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })()}

          {/* ── MARKETPLACE CARD ── */}
          {latestItem && (() => {
            const isFree = !latestItem.price || Number(latestItem.price) === 0;
            const initials = latestItem.title.slice(0, 1).toUpperCase();
            return (
              <Link href={`/marketplace/${latestItem.id}`} className="app-card card-lift card-lift-pink" style={{
                display: "block", textDecoration: "none", overflow: "hidden",
                borderTop: "2px solid var(--neon-pink)",
              }}>
                {/* Image */}
                <div style={{
                  width: "100%", aspectRatio: "16/9", position: "relative",
                  background: "linear-gradient(135deg, #1a001a, var(--bg-1))",
                  overflow: "hidden", borderBottom: "1px solid var(--line)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "2.5rem", color: "var(--text-2)",
                }}>
                  {latestItem.image_url ? (
                    <Image src={latestItem.image_url} alt={latestItem.title} fill style={{ objectFit: "cover" }} sizes="33vw" />
                  ) : "🎬"}
                  {/* Activity badge */}
                  <div style={{
                    position: "absolute", top: ".5rem", right: ".5rem",
                    background: "rgba(0,0,0,.75)", border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "3px", padding: ".15rem .45rem",
                    fontFamily: "var(--font-mono), monospace", fontSize: ".58rem",
                    letterSpacing: ".06em", color: "var(--text-1)",
                    display: "flex", alignItems: "center", gap: ".3rem",
                    backdropFilter: "blur(4px)",
                  }}>
                    <span className="hc-activity-dot" style={{ background: "var(--neon-pink)" }} />
                    {itemSoldCount > 0 ? `Sold ${itemSoldCount}×` : "New"}
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: ".85rem 1rem 1rem" }}>
                  {/* Item initials row */}
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".5rem" }}>
                    <div style={{
                      width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                      background: "linear-gradient(135deg, var(--neon-pink), var(--neon-orange))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: ".65rem", fontWeight: 800, color: "#000",
                    }}>
                      {initials}
                    </div>
                    <span style={{ fontSize: ".72rem", color: "var(--neon-pink)" }}>Digital Item</span>
                    <span style={{
                      marginLeft: "auto", fontFamily: "var(--font-mono), monospace",
                      fontSize: ".62rem", color: "var(--text-2)",
                    }}>
                      {timeSince(latestItem.created_at)}
                    </span>
                  </div>
                  {/* Title */}
                  <h3 className="display" style={{ fontSize: "1rem", letterSpacing: ".04em", color: "var(--text-0)", marginBottom: ".4rem" }}>
                    {latestItem.title}
                  </h3>
                  {/* Proof pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: ".3rem", marginBottom: ".5rem" }}>
                    <span className="tag tag-muted">
                      {itemSoldCount > 0 ? `🛒 ${itemSoldCount} sold` : "🛒 New"}
                    </span>
                    <span className="tag tag-muted">✏️ Editable</span>
                    <span className="tag tag-muted">📲 Instant delivery</span>
                  </div>
                  {/* Static micro-quote */}
                  <p style={{
                    fontSize: ".72rem", color: "var(--text-1)", lineHeight: 1.5,
                    fontStyle: "italic",
                    borderLeft: "2px solid rgba(255,0,153,.3)", paddingLeft: ".55rem",
                    marginBottom: ".65rem",
                  }}>
                    {/* Static social proof copy — no review system yet */}
                    &ldquo;Posted 5 pieces of content in a weekend with this.&rdquo;
                  </p>
                  {/* Footer */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: ".6rem", borderTop: "1px solid var(--line)",
                  }}>
                    <span style={{
                      fontFamily: "var(--font-display), cursive", fontSize: "1rem",
                      color: "var(--neon-pink)", textShadow: "0 0 8px rgba(255,0,153,.3)",
                    }}>
                      {isFree ? "FREE" : `₹${Number(latestItem.price).toLocaleString()}`}
                    </span>
                    <span className="btn-neon btn-sm" style={{
                      fontSize: ".7rem", pointerEvents: "none",
                      borderColor: "var(--neon-pink)", color: "var(--neon-pink)",
                      background: "rgba(255,0,153,.06)",
                    }}>
                      BUY NOW →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })()}

        </div>
      </div>
    </section>
  );
}

// ── CHANNEL CARD ────────────────────────────────────────────

function ChannelCard({
  num, title, body, href, cta, accentClass, hoverClass,
}: {
  num: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  accentClass: string;
  hoverClass: string;
}) {
  return (
    <Link
      href={href}
      className={`app-card ${hoverClass}`}
      style={{ display: "block", padding: "1.75rem" }}
    >
      <span className={`mono ${accentClass}`} style={{ fontSize: ".65rem", letterSpacing: ".2em", opacity: .8 }}>
        {num}
      </span>
      <h3 className={`display ${accentClass}`} style={{ fontSize: "2rem", marginTop: ".4rem", marginBottom: ".75rem" }}>
        {title}
      </h3>
      <p style={{ color: "var(--text-1)", fontSize: ".875rem", lineHeight: 1.65, marginBottom: "1.25rem" }}>
        {body}
      </p>
      <span style={{ fontSize: ".8rem", color: "var(--text-2)", letterSpacing: ".05em" }}>
        {cta} →
      </span>
    </Link>
  );
}

// ── ROLE ROW ────────────────────────────────────────────────

function RoleRow({
  icon, title, detail, color = "var(--text-0)",
}: {
  icon: string;
  title: string;
  detail: string;
  color?: string;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      padding: ".85rem 1rem",
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: "var(--radius-sm)",
    }}>
      <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{
          fontFamily: "var(--font-display), cursive",
          fontSize: "1.1rem",
          letterSpacing: ".06em",
          color,
        }}>
          {title.toUpperCase()}
        </div>
        <div style={{ fontSize: ".8rem", color: "var(--text-1)", marginTop: ".15rem" }}>
          {detail}
        </div>
      </div>
    </div>
  );
}
