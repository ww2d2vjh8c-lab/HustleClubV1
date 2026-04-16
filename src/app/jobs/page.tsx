import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isProfileComplete } from "@/lib/profile/isProfileComplete";
import ProfileHoverCard from "@/components/profile/ProfileHoverCard";
import ApplyButton from "@/components/jobs/ApplyButton";
import { parseJobDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type JobRow = {
  id: number;
  title: string;
  description: string | null;
  created_at: string;
  is_open: boolean;
  creator_id: string;
  budget: number | null;
  type: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

type JobsPageProps = {
  searchParams?: {
    q?: string;
    type?: string;
  };
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;
  const { q: rawQ, type: rawType } = searchParams ?? {};
  const q = rawQ?.trim() ?? "";
  const type = rawType ?? "all";

  /* ================= FETCH JOBS ================= */

  let jobsQuery = supabase
    .from("jobs")
    .select(`
      id,
      title,
      description,
      created_at,
      is_open,
      creator_id,
      budget,
      type
    `)
    .eq("is_open", true);

  if (q) {
    const safeQ = q.replace(/[%,"']/g, " ").trim();
    if (safeQ) {
      jobsQuery = jobsQuery.or(
        `title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`
      );
    }
  }

  if (type !== "all") {
    jobsQuery = jobsQuery.eq("type", type);
  }

  const { data: jobs, error } = await jobsQuery
    .order("created_at", { ascending: false })
    .returns<JobRow[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load jobs.
      </div>
    );
  }

  /* ================= FETCH PROFILES ================= */

  const creatorIds = jobs?.map((job) => job.creator_id) ?? [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio
    `)
    .in("id", creatorIds)
    .returns<ProfileRow[]>();

  const profileMap =
    profiles?.reduce((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {} as Record<string, ProfileRow>) ?? {};

  /* ================= RENDER ================= */

  return (
    <main className="app-container" style={{ padding: "2.5rem 0 4rem" }}>
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".75rem" }}>
          <div style={{ width: "24px", height: "2px", background: "var(--neon-orange)", boxShadow: "var(--glow-orange-sm)" }} />
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".65rem", letterSpacing: ".2em", color: "var(--neon-orange)", textTransform: "uppercase" }}>
            Opportunities
          </span>
        </div>
        <h1 className="page-title">JOBS <span style={{ color: "var(--neon-orange)", textShadow: "var(--glow-orange-sm)" }}>&amp; GIGS</span></h1>
        <p className="page-subtitle">Find paid creator work. Apply in seconds. Build your reputation.</p>
      </div>

      {/* Search/filter bar */}
      <form style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        gap: ".5rem",
        marginBottom: "2rem",
      }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="SEARCH JOBS..."
          style={{
            padding: ".6rem 1rem",
            fontSize: ".85rem",
            fontFamily: "var(--font-mono), monospace",
            letterSpacing: ".05em",
          }}
        />
        <select
          name="type"
          defaultValue={type}
          style={{ padding: ".6rem .9rem", fontSize: ".85rem", cursor: "pointer" }}
        >
          <option value="all">ALL TYPES</option>
          <option value="design">DESIGN</option>
          <option value="writing">WRITING</option>
          <option value="video">VIDEO</option>
          <option value="tech">TECH</option>
          <option value="marketing">MARKETING</option>
          <option value="other">OTHER</option>
        </select>
        <button type="submit" className="btn-neon" style={{ fontSize: ".85rem" }}>
          SEARCH
        </button>
      </form>

      {/* Jobs list */}
      {jobs && jobs.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1px", border: "1px solid var(--line)", borderRadius: "4px", overflow: "hidden", background: "var(--line)" }}>
          {jobs.map((job) => {
            const creator = profileMap[job.creator_id] ?? null;
            const parsedDescription = job.description ? parseJobDescription(job.description) : null;
            return (
              <div key={job.id} style={{
                background: "var(--surface-strong)",
                padding: "1.25rem 1.5rem",
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: "1rem",
                alignItems: "start",
                transition: "background 150ms ease",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-strong)")}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".5rem", flexWrap: "wrap" }}>
                    {job.type && (
                      <span className="badge badge-orange">{job.type.toUpperCase()}</span>
                    )}
                    {job.budget && (
                      <span className="badge badge-green">
                        ₹{job.budget.toLocaleString()}
                      </span>
                    )}
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".62rem", color: "var(--text-2)", letterSpacing: ".05em" }}>
                      {new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  <h3 style={{
                    fontFamily: "var(--font-display), cursive",
                    fontSize: "1.4rem",
                    letterSpacing: ".05em",
                    margin: "0 0 .5rem",
                    color: "var(--text-0)",
                  }}>
                    <a href={`/jobs/${job.id}`} style={{ textDecoration: "none", color: "inherit" }}
                      onMouseEnter={e => ((e.target as HTMLElement).style.color = "var(--neon-orange)")}
                      onMouseLeave={e => ((e.target as HTMLElement).style.color = "var(--text-0)")}
                    >
                      {job.title}
                    </a>
                  </h3>

                  {parsedDescription?.overview && (
                    <p style={{ color: "var(--text-1)", fontSize: ".85rem", lineHeight: 1.6, margin: "0 0 .75rem", maxWidth: "600px" }}>
                      {parsedDescription.overview}
                    </p>
                  )}

                  {creator && (
                    <ProfileHoverCard
                      username={creator.username ?? "anonymous"}
                      fullName={creator.full_name}
                      avatarUrl={creator.avatar_url}
                      bio={creator.bio}
                    />
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", alignItems: "flex-end", minWidth: "120px" }}>
                  {job.is_open ? (
                    user && profileComplete ? (
                      <ApplyButton jobId={String(job.id)} />
                    ) : user ? (
                      <a href="/profile" className="btn-neon" style={{ fontSize: ".75rem", padding: ".35rem .8rem" }}>
                        COMPLETE PROFILE
                      </a>
                    ) : (
                      <a href="/login" className="btn-neon" style={{ fontSize: ".75rem", padding: ".35rem .8rem" }}>
                        LOGIN TO APPLY
                      </a>
                    )
                  ) : (
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".7rem", color: "var(--text-2)", letterSpacing: ".05em" }}>
                      CLOSED
                    </span>
                  )}
                  <a href={`/jobs/${job.id}`} className="btn-ghost" style={{ fontSize: ".75rem", padding: ".35rem .8rem" }}>
                    VIEW DETAILS
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: "center",
          padding: "5rem 2rem",
          border: "1px solid var(--line)",
          borderRadius: "4px",
          background: "var(--surface-strong)",
        }}>
          <div style={{ fontFamily: "var(--font-display), cursive", fontSize: "3rem", color: "var(--text-2)", letterSpacing: ".1em" }}>
            NO JOBS FOUND
          </div>
          <p style={{ color: "var(--text-2)", marginTop: ".75rem", fontFamily: "var(--font-mono), monospace", fontSize: ".8rem", letterSpacing: ".05em" }}>
            {q ? `NO RESULTS FOR "${q.toUpperCase()}"` : "CHECK BACK SOON — NEW GIGS DROP REGULARLY"}
          </p>
        </div>
      )}
    </main>
  );
}