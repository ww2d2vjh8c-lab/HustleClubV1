import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";
import { headers } from "next/headers";
import { parseJobDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type JobWithCreator = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  views: number | null;
  budget: number | null;
  type: string | null;
  creator_id: string;
  profile: {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    bio: string | null;
  }[] | null;
};

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user ? await isProfileComplete(user.id) : false;

  const { data: job, error } = await supabase
    .from("jobs")
    .select(`id, title, description, created_at, is_open, views, budget, type, creator_id,
      profile:profiles!jobs_creator_id_fkey (id, username, full_name, avatar_url, bio)`)
    .eq("id", Number(id))
    .single<JobWithCreator>();

  if (error || !job) {
    return (
      <main className="app-container" style={{ paddingBottom: "4rem" }}>
        <div style={{
          textAlign: "center", padding: "5rem 2rem",
          border: "1px solid var(--line)", borderRadius: "var(--radius)",
          background: "var(--surface-strong)", marginTop: "2rem",
        }}>
          <div className="display" style={{ fontSize: "2rem", color: "var(--text-2)" }}>JOB NOT FOUND</div>
          <p className="mono" style={{ fontSize: ".75rem", color: "var(--text-2)", marginTop: ".75rem" }}>
            This job may have been closed or removed.
          </p>
          <Link href="/jobs" className="btn-ghost" style={{ display: "inline-block", marginTop: "1.25rem" }}>
            ← BACK TO JOBS
          </Link>
        </div>
      </main>
    );
  }

  /* ================= UNIQUE VIEW SYSTEM ================= */

  const isCreatorViewing = user?.id === job.creator_id;

  if (!isCreatorViewing) {

    // CASE 1: Logged-in user (lifetime unique)
    if (user) {
      const { data: existingView } = await supabase
        .from("job_views")
        .select("id")
        .eq("job_id", job.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingView) {
        await supabase.from("job_views").insert({
          job_id: job.id,
          user_id: user.id,
        });

        await supabase
          .from("jobs")
          .update({
            views: job.views ? job.views + 1 : 1,
          })
          .eq("id", job.id);
      }
    }

    // CASE 2: Anonymous user (IP-based)
    else {
      const headersList = await headers();
      const forwarded = headersList.get("x-forwarded-for");
      const ip =
        forwarded?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        "unknown";

      const { data: existingIpView } = await supabase
        .from("job_ip_views")
        .select("id")
        .eq("job_id", job.id)
        .eq("ip_address", ip)
        .maybeSingle();

      if (!existingIpView) {
        await supabase.from("job_ip_views").insert({
          job_id: job.id,
          ip_address: ip,
        });

        await supabase
          .from("jobs")
          .update({
            views: job.views ? job.views + 1 : 1,
          })
          .eq("id", job.id);
      }
    }
  }

  /* ======================================================= */

  const creator = job.profile?.[0] ?? null;
  const parsed = parseJobDescription(job.description);

  const [applicationCountResult, hasAppliedResult, relatedJobsResult] = await Promise.all([
    supabase
      .from("job_applications")
      .select("id", { head: true, count: "exact" })
      .eq("job_id", job.id),
    user && !isCreatorViewing
      ? supabase
          .from("job_applications")
          .select("id")
          .eq("job_id", job.id)
          .eq("applicant_id", user.id)
          .maybeSingle()
      : Promise.resolve(null),
    supabase
      .from("jobs")
      .select("id, title, budget, type, is_open")
      .eq("creator_id", job.creator_id)
      .eq("is_open", true)
      .neq("id", job.id)
      .limit(3),
  ]);

  const applicationCount = applicationCountResult.count ?? 0;
  const hasApplied = !!hasAppliedResult?.data;
  const relatedJobs = relatedJobsResult.data ?? [];

  const creatorInitials =
    (creator?.full_name ?? creator?.username ?? "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "C";

  return (
    <main className="app-container" style={{ paddingBottom: "5rem" }}>

      {/* ── CREATOR BANNER ── */}
      {isCreatorViewing && (
        <div style={{
          background: "rgba(0,238,255,.06)",
          border: "1px solid rgba(0,238,255,.18)",
          borderRadius: "var(--radius)",
          padding: ".75rem 1.25rem",
          marginBottom: "1.25rem",
          marginTop: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: ".5rem",
        }}>
          <span className="mono" style={{ fontSize: ".65rem", letterSpacing: ".15em", color: "var(--neon-cyan)" }}>
            ▸ YOUR JOB POST
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span className="mono" style={{ fontSize: ".65rem", color: "var(--text-2)", letterSpacing: ".08em" }}>
              {applicationCount} applicants · {job.views ?? 0} views
            </span>
            <Link href="/creator/jobs" className="mono" style={{
              fontSize: ".65rem", letterSpacing: ".1em", color: "var(--neon-cyan)",
              textDecoration: "none", borderBottom: "1px solid rgba(0,238,255,.3)",
            }}>
              MANAGE POSTS →
            </Link>
          </div>
        </div>
      )}

      {/* ── BACK LINK ── */}
      <div style={{ marginBottom: "1.5rem", marginTop: isCreatorViewing ? "0" : "1rem" }}>
        <Link href="/jobs" style={{
          fontFamily: "var(--font-mono), monospace", fontSize: ".7rem",
          letterSpacing: ".1em", color: "var(--text-2)", textDecoration: "none",
        }}>
          ← Back to Jobs
        </Link>
      </div>

      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        padding: "3rem 2rem 2.5rem",
        background: "linear-gradient(135deg, #00001a 0%, #001a1a 50%, #0d0d0d 100%)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--line)",
        marginBottom: "2rem",
        overflow: "hidden",
      }}>
        {/* atmospheric dot pattern */}
        <div style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(0,238,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />

        {/* hero content */}
        <div style={{ position: "relative" }}>
          {/* tags row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: "1rem" }}>
            <span className="tag tag-cyan">JOB POSTING</span>
            {job.type && (
              <span className="tag tag-orange">{job.type.toUpperCase()}</span>
            )}
            <span className="tag" style={{
              background: job.is_open ? "rgba(0,232,122,.1)" : "rgba(255,0,153,.1)",
              border: `1px solid ${job.is_open ? "rgba(0,232,122,.3)" : "rgba(255,0,153,.3)"}`,
              color: job.is_open ? "var(--neon-green)" : "var(--neon-pink)",
            }}>
              {job.is_open ? "● ACCEPTING" : "✕ CLOSED"}
            </span>
          </div>

          <h1 className="display" style={{
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            letterSpacing: ".04em",
            color: "var(--text-0)",
            lineHeight: 1.15,
            marginBottom: "1rem",
            maxWidth: "720px",
          }}>
            {job.title}
          </h1>

          {/* creator byline */}
          {creator && (
            <p className="mono" style={{
              fontSize: ".7rem",
              letterSpacing: ".1em",
              color: "var(--text-2)",
            }}>
              POSTED BY{" "}
              <Link href={`/u/${creator.username}`} style={{
                color: "var(--neon-cyan)",
                textDecoration: "none",
                borderBottom: "1px solid rgba(0,238,255,.25)",
              }}>
                @{creator.username ?? creator.full_name ?? "unknown"}
              </Link>
              {" "}· {daysAgo(job.created_at).toUpperCase()}
            </p>
          )}
        </div>
      </div>

      {/* ── 2-COLUMN GRID ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: "2rem",
        alignItems: "start",
      }}>

        {/* ── LEFT COLUMN ── */}
        <section>

          {/* A) Creator card */}
          {creator && (
            <div className="app-card" style={{
              borderLeft: "3px solid var(--neon-cyan)",
              padding: "1.1rem 1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "1rem",
            }}>
              {/* avatar */}
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--neon-cyan), rgba(0,100,150,.5))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontFamily: "var(--font-display), cursive",
                fontSize: "1.1rem",
                letterSpacing: ".04em",
                color: "var(--bg-0)",
              }}>
                {creatorInitials}
              </div>

              {/* info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: ".5rem", flexWrap: "wrap" }}>
                  <span className="display" style={{ fontSize: "1rem", color: "var(--text-0)", letterSpacing: ".04em" }}>
                    {creator.full_name ?? creator.username ?? "Creator"}
                  </span>
                  {creator.username && (
                    <Link href={`/u/${creator.username}`} style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: ".68rem",
                      letterSpacing: ".08em",
                      color: "var(--neon-cyan)",
                      textDecoration: "none",
                    }}>
                      @{creator.username}
                    </Link>
                  )}
                </div>
                {creator.bio && (
                  <p style={{
                    fontSize: ".75rem",
                    color: "var(--text-2)",
                    marginTop: ".25rem",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {creator.bio.slice(0, 80)}{creator.bio.length > 80 ? "…" : ""}
                  </p>
                )}
              </div>

              {/* posted timestamp */}
              <div className="mono" style={{
                fontSize: ".58rem",
                letterSpacing: ".1em",
                color: "var(--text-2)",
                textTransform: "uppercase",
                flexShrink: 0,
                textAlign: "right",
                lineHeight: 1.6,
              }}>
                POSTED<br />{daysAgo(job.created_at)}
              </div>
            </div>
          )}

          {/* B) Meta tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem", marginBottom: "1.5rem" }}>
            {job.type && <span className="tag tag-orange">{job.type.toUpperCase()}</span>}
            {job.budget && <span className="tag tag-green">₹{job.budget.toLocaleString()}</span>}
            <span className="tag tag-muted">{applicationCount} applications</span>
            <span className="tag tag-muted">{job.views ?? 0} views</span>
            <span className="tag" style={{
              background: job.is_open ? "rgba(0,232,122,.1)" : "rgba(255,0,153,.1)",
              border: `1px solid ${job.is_open ? "rgba(0,232,122,.3)" : "rgba(255,0,153,.3)"}`,
              color: job.is_open ? "var(--neon-green)" : "var(--neon-pink)",
            }}>
              {job.is_open ? "OPEN" : "CLOSED"}
            </span>
          </div>

          {/* C) Overview */}
          {parsed.overview && (
            <p style={{
              color: "var(--text-1)",
              fontSize: ".95rem",
              lineHeight: 1.75,
              marginBottom: "1.75rem",
              maxWidth: "640px",
            }}>
              {parsed.overview}
            </p>
          )}

          {/* D) Sections */}
          <JobSection title="Responsibilities" items={parsed.responsibilities} accentColor="var(--neon-orange)" />
          <JobSection title="Requirements" items={parsed.requirements} accentColor="var(--neon-cyan)" />
          <JobSection title="Deliverables" items={parsed.deliverables} accentColor="var(--neon-green)" />

          {/* E) Timeline + Ideal Candidate */}
          {(parsed.timeline || parsed.idealCandidate) && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.75rem",
            }}>
              {parsed.timeline && (
                <div className="app-card" style={{
                  padding: "1.1rem",
                  borderTop: "2px solid var(--neon-orange)",
                }}>
                  <p className="mono" style={{
                    fontSize: ".58rem", letterSpacing: ".15em",
                    color: "var(--neon-orange)", textTransform: "uppercase",
                    marginBottom: ".5rem",
                  }}>
                    Timeline
                  </p>
                  <p style={{ fontSize: ".875rem", color: "var(--text-1)", lineHeight: 1.55 }}>
                    {parsed.timeline}
                  </p>
                </div>
              )}
              {parsed.idealCandidate && (
                <div className="app-card" style={{
                  padding: "1.1rem",
                  borderTop: "2px solid var(--neon-cyan)",
                }}>
                  <p className="mono" style={{
                    fontSize: ".58rem", letterSpacing: ".15em",
                    color: "var(--neon-cyan)", textTransform: "uppercase",
                    marginBottom: ".5rem",
                  }}>
                    Ideal Candidate
                  </p>
                  <p style={{ fontSize: ".875rem", color: "var(--text-1)", lineHeight: 1.55 }}>
                    {parsed.idealCandidate}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* F) Activity bar */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.5rem",
            padding: "1rem 1.25rem",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1.75rem",
          }}>
            {[
              { icon: "👁", label: `${job.views ?? 0} views` },
              { icon: "📋", label: `${applicationCount} applicants` },
              { icon: "🗓", label: `Posted ${daysAgo(job.created_at)}` },
              { icon: "✅", label: job.is_open ? "Accepting applications" : "Closed" },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: ".4rem",
                fontFamily: "var(--font-mono), monospace",
                fontSize: ".68rem", letterSpacing: ".06em",
                color: "var(--text-2)",
              }}>
                <span style={{ fontSize: ".85rem" }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ── RIGHT SIDEBAR ── */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <div className="app-card" style={{
            borderTop: "2px solid var(--neon-cyan)",
            padding: "1.5rem",
          }}>
            {/* Budget */}
            <div className="mono" style={{
              fontSize: ".58rem", letterSpacing: ".15em",
              textTransform: "uppercase", color: "var(--text-2)",
              marginBottom: ".4rem",
            }}>
              Budget
            </div>
            <div className="display" style={{
              fontSize: "2rem", letterSpacing: ".04em",
              color: "var(--neon-cyan)", marginBottom: "1rem",
              textShadow: "0 0 16px rgba(0,238,255,.3)",
            }}>
              ₹{job.budget?.toLocaleString() ?? "0"}
            </div>

            {/* Stats */}
            <div style={{
              display: "flex", flexDirection: "column",
              gap: ".4rem", marginBottom: "1.25rem",
            }}>
              {[
                `${job.views ?? 0} views`,
                `${applicationCount} total applications`,
                `Status: ${job.is_open ? "Open" : "Closed"}`,
                ...(job.type ? [`Type: ${job.type}`] : []),
              ].map((f) => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", gap: ".5rem",
                  fontSize: ".8rem", color: "var(--text-1)",
                }}>
                  <span style={{ color: "var(--neon-cyan)", fontSize: ".65rem" }}>›</span>
                  {f}
                </div>
              ))}
            </div>

            {/* CTA state machine */}
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {isCreatorViewing && (
                <Link
                  href={`/creator/jobs/${job.id}/applications`}
                  className="btn-neon"
                  style={{
                    display: "block", textAlign: "center",
                    borderColor: "var(--neon-cyan)", color: "var(--neon-cyan)",
                    background: "rgba(0,238,255,.06)",
                  }}
                >
                  VIEW {applicationCount} APPLICANTS →
                </Link>
              )}

              {!isCreatorViewing && !job.is_open && (
                <div style={{
                  padding: ".6rem 1rem", borderRadius: "var(--radius-sm)",
                  textAlign: "center",
                  background: "rgba(255,0,153,.08)",
                  border: "1px solid rgba(255,0,153,.25)",
                  color: "var(--neon-pink)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: ".72rem", letterSpacing: ".1em",
                }}>
                  APPLICATIONS CLOSED
                </div>
              )}

              {!isCreatorViewing && job.is_open && hasApplied && (
                <div style={{
                  padding: ".6rem 1rem", borderRadius: "var(--radius-sm)",
                  textAlign: "center",
                  background: "rgba(0,232,122,.08)",
                  border: "1px solid rgba(0,232,122,.25)",
                  color: "var(--neon-green)",
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: ".72rem", letterSpacing: ".1em",
                }}>
                  ✓ APPLICATION SUBMITTED
                </div>
              )}

              {!isCreatorViewing && job.is_open && !hasApplied && user && profileComplete && (
                <ApplyButton jobId={String(job.id)} />
              )}

              {!isCreatorViewing && job.is_open && !hasApplied && user && !profileComplete && (
                <Link href="/profile" className="btn-neon" style={{
                  display: "block", textAlign: "center",
                  borderColor: "var(--neon-orange)", color: "var(--neon-orange)",
                  background: "rgba(255,102,0,.08)",
                }}>
                  COMPLETE PROFILE FIRST
                </Link>
              )}

              {!isCreatorViewing && job.is_open && !user && (
                <Link href="/login" className="btn-neon-solid" style={{ display: "block", textAlign: "center" }}>
                  LOGIN TO APPLY →
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── MORE JOBS FROM CREATOR ── */}
      {relatedJobs.length > 0 && (
        <div style={{ marginTop: "3rem" }}>
          <p className="mono" style={{
            fontSize: ".6rem", letterSpacing: ".2em",
            color: "var(--text-2)", textTransform: "uppercase",
            marginBottom: ".35rem",
          }}>
            More from this creator
          </p>
          <h2 className="display" style={{
            fontSize: "1.3rem", letterSpacing: ".06em",
            color: "var(--text-0)", marginBottom: "1rem",
          }}>
            OTHER OPEN JOBS
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
            {relatedJobs.map((rj) => (
              <Link
                key={rj.id}
                href={`/jobs/${rj.id}`}
                className="app-card card-lift-cyan"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "1rem",
                  padding: ".9rem 1.1rem",
                  textDecoration: "none",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem", flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontSize: ".9rem", fontWeight: 500,
                    color: "var(--text-0)", letterSpacing: ".02em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {rj.title}
                  </span>
                  {rj.type && (
                    <span className="tag tag-orange" style={{ flexShrink: 0 }}>
                      {rj.type.toUpperCase()}
                    </span>
                  )}
                </div>
                {rj.budget && (
                  <span className="display" style={{
                    fontSize: "1.1rem", letterSpacing: ".04em",
                    color: "var(--neon-cyan)", flexShrink: 0,
                    textShadow: "0 0 10px rgba(0,238,255,.25)",
                  }}>
                    ₹{rj.budget.toLocaleString()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function JobSection({
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
      <h2 className="display" style={{
        fontSize: "1.1rem", letterSpacing: ".06em",
        color: "var(--text-0)", marginBottom: ".75rem",
        paddingBottom: ".4rem", borderBottom: "1px solid var(--line)",
      }}>
        {title.toUpperCase()}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex", alignItems: "flex-start", gap: ".6rem",
              padding: ".6rem .8rem",
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
              fontSize: ".875rem", color: "var(--text-1)", lineHeight: 1.55,
            }}
          >
            <span style={{
              color: accentColor, fontSize: ".65rem",
              marginTop: ".2rem", flexShrink: 0,
            }}>▸</span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
