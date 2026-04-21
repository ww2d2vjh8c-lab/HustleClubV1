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

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;

  const { data: job, error } = await supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      created_at,
      is_open,
      views,
      budget,
      type,
      creator_id,
      profile:profiles!jobs_creator_id_fkey (
        id,
        username,
        full_name,
        avatar_url,
        bio
      )
    `)
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

    // 🔹 CASE 1: Logged-in user (lifetime unique)
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

    // 🔹 CASE 2: Anonymous user (IP-based)
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
  const { count: applicationCount } = await supabase
    .from("job_applications")
    .select("id", { head: true, count: "exact" })
    .eq("job_id", job.id);

  return (
    <main className="app-container" style={{ paddingBottom: "5rem" }}>

      {/* ── BACK LINK ── */}
      <div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
        <Link href="/jobs" style={{
          fontFamily: "var(--font-mono), monospace", fontSize: ".7rem",
          letterSpacing: ".1em", color: "var(--text-2)", textDecoration: "none",
        }}>
          ← Back to Jobs
        </Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: "2rem",
        alignItems: "start",
      }}>

        {/* ── LEFT: JOB CONTENT ── */}
        <section>
          {/* Creator card */}
          {creator && (
            <div style={{ marginBottom: "1.25rem" }}>
              <ProfileHoverCard
                username={creator.username ?? "anonymous"}
                fullName={creator.full_name}
                avatarUrl={creator.avatar_url}
                bio={creator.bio}
              />
            </div>
          )}

          {/* Title + meta */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1 className="display" style={{
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)", letterSpacing: ".04em",
              color: "var(--text-0)", marginBottom: ".6rem", lineHeight: 1.2,
            }}>
              {job.title}
            </h1>
            <p className="mono" style={{ fontSize: ".65rem", color: "var(--text-2)", letterSpacing: ".1em", marginBottom: ".75rem" }}>
              Posted {new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: ".4rem" }}>
              {job.type && <span className="tag tag-orange">{job.type.toUpperCase()}</span>}
              {job.budget && <span className="tag tag-green">₹{job.budget.toLocaleString()}</span>}
              <span className="tag tag-muted">{applicationCount ?? 0} applications</span>
              <span className="tag tag-muted">{job.views ?? 0} views</span>
              <span className="tag" style={{
                background: job.is_open ? "rgba(0,232,122,.1)" : "rgba(255,0,153,.1)",
                border: `1px solid ${job.is_open ? "rgba(0,232,122,.3)" : "rgba(255,0,153,.3)"}`,
                color: job.is_open ? "var(--neon-green)" : "var(--neon-pink)",
              }}>
                {job.is_open ? "OPEN" : "CLOSED"}
              </span>
            </div>
          </div>

          {/* Overview */}
          {parsed.overview && (
            <p style={{
              color: "var(--text-1)", fontSize: ".95rem", lineHeight: 1.75,
              marginBottom: "1.75rem", maxWidth: "640px",
            }}>
              {parsed.overview}
            </p>
          )}

          <JobSection title="Responsibilities" items={parsed.responsibilities} accentColor="var(--neon-orange)" />
          <JobSection title="Requirements" items={parsed.requirements} accentColor="var(--neon-cyan)" />
          <JobSection title="Deliverables" items={parsed.deliverables} accentColor="var(--neon-green)" />

          {/* Timeline + Ideal Candidate */}
          {(parsed.timeline || parsed.idealCandidate) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.75rem" }}>
              {parsed.timeline && (
                <div className="app-card" style={{ padding: "1rem" }}>
                  <p className="mono" style={{ fontSize: ".58rem", letterSpacing: ".15em", color: "var(--text-2)", textTransform: "uppercase", marginBottom: ".4rem" }}>Timeline</p>
                  <p style={{ fontSize: ".875rem", color: "var(--text-1)" }}>{parsed.timeline}</p>
                </div>
              )}
              {parsed.idealCandidate && (
                <div className="app-card" style={{ padding: "1rem" }}>
                  <p className="mono" style={{ fontSize: ".58rem", letterSpacing: ".15em", color: "var(--text-2)", textTransform: "uppercase", marginBottom: ".4rem" }}>Ideal Candidate</p>
                  <p style={{ fontSize: ".875rem", color: "var(--text-1)" }}>{parsed.idealCandidate}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── RIGHT: APPLY SIDEBAR ── */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <div className="app-card" style={{ borderTop: "2px solid var(--neon-cyan)", padding: "1.5rem" }}>
            <div style={{
              fontFamily: "var(--font-mono), monospace", fontSize: ".58rem",
              letterSpacing: ".15em", textTransform: "uppercase",
              color: "var(--text-2)", marginBottom: ".5rem",
            }}>
              Budget
            </div>

            <div style={{
              fontFamily: "var(--font-display), cursive",
              fontSize: "2rem", letterSpacing: ".04em",
              color: "var(--neon-cyan)", marginBottom: ".25rem",
              textShadow: "0 0 16px rgba(0,238,255,.3)",
            }}>
              ₹{job.budget?.toLocaleString() ?? "0"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginBottom: "1.25rem" }}>
              {[
                `${job.views ?? 0} views`,
                `${applicationCount ?? 0} total applications`,
                `Status: ${job.is_open ? "Open" : "Closed"}`,
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".8rem", color: "var(--text-1)" }}>
                  <span style={{ color: "var(--neon-cyan)", fontSize: ".65rem" }}>›</span>
                  {f}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {!job.is_open && (
                <div style={{
                  padding: ".6rem 1rem", borderRadius: "var(--radius-sm)", textAlign: "center",
                  background: "rgba(255,0,153,.08)", border: "1px solid rgba(255,0,153,.25)",
                  color: "var(--neon-pink)", fontFamily: "var(--font-mono), monospace",
                  fontSize: ".72rem", letterSpacing: ".1em",
                }}>
                  APPLICATIONS CLOSED
                </div>
              )}

              {job.is_open && user && profileComplete && <ApplyButton jobId={String(job.id)} />}

              {job.is_open && user && !profileComplete && (
                <Link href="/profile" className="btn-neon" style={{
                  display: "block", textAlign: "center",
                  borderColor: "var(--neon-orange)", color: "var(--neon-orange)",
                  background: "rgba(255,102,0,.08)",
                }}>
                  COMPLETE PROFILE FIRST
                </Link>
              )}

              {job.is_open && !user && (
                <Link href="/login" className="btn-neon-solid" style={{ display: "block", textAlign: "center" }}>
                  LOGIN TO APPLY →
                </Link>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function JobSection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <h2 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.1rem", letterSpacing: ".06em",
        color: "var(--text-0)", marginBottom: ".75rem",
        paddingBottom: ".4rem", borderBottom: "1px solid var(--line)",
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
