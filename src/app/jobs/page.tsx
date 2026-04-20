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
  searchParams?: Promise<{ q?: string; type?: string }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profileComplete = user
    ? await isProfileComplete(user.id)
    : false;
  const { q: rawQ, type: rawType } = (await searchParams) ?? {};
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
    <main className="app-container" style={{ paddingBottom: "4rem" }}>
      {/* Page header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <p className="section-tag" style={{ marginBottom: ".4rem" }}>Opportunities</p>
            <h1 className="page-title">
              JOBS &amp; <span className="accent-orange">GIGS</span>
            </h1>
            <p className="page-subtitle">Find paid creator work. Apply in seconds.</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <form style={{ display: "flex", gap: ".5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search jobs..."
          className="field-input"
          style={{ flex: "1", minWidth: "200px" }}
        />
        <select
          name="type"
          defaultValue={type}
          className="field-input"
          style={{ width: "auto", minWidth: "140px", cursor: "pointer" }}
        >
          <option value="all">All Types</option>
          <option value="design">Design</option>
          <option value="writing">Writing</option>
          <option value="video">Video</option>
          <option value="tech">Tech</option>
          <option value="marketing">Marketing</option>
          <option value="other">Other</option>
        </select>
        <button type="submit" className="btn-neon">SEARCH</button>
      </form>

      {/* Job list */}
      {jobs && jobs.length > 0 ? (
        <div style={{
          border: "1px solid var(--line)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}>
          {jobs.map((job, i) => {
            const creator = profileMap[job.creator_id] ?? null;
            const parsedDescription = job.description ? parseJobDescription(job.description) : null;
            return (
              <div
                key={job.id}
                className="row-hover"
                style={{
                  padding: "1.25rem 1.5rem",
                  borderBottom: i < jobs.length - 1 ? "1px solid var(--line)" : "none",
                  background: "var(--surface-strong)",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                <div>
                  {/* Meta row */}
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: ".4rem", marginBottom: ".5rem" }}>
                    {job.type && <span className="tag tag-orange">{job.type}</span>}
                    {job.budget && (
                      <span className="tag tag-green">₹{job.budget.toLocaleString()}</span>
                    )}
                    <span className="mono text-dim" style={{ fontSize: ".68rem" }}>
                      {new Date(job.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>

                  {/* Title */}
                  <a
                    href={`/jobs/${job.id}`}
                    className="link-glow display"
                    style={{
                      display: "block",
                      fontSize: "1.3rem",
                      letterSpacing: ".04em",
                      color: "var(--text-0)",
                      marginBottom: ".45rem",
                    }}
                  >
                    {job.title}
                  </a>

                  {/* Description preview */}
                  {parsedDescription?.overview && (
                    <p style={{
                      color: "var(--text-1)",
                      fontSize: ".85rem",
                      lineHeight: 1.6,
                      margin: "0 0 .65rem",
                      maxWidth: "580px",
                    }}>
                      {parsedDescription.overview}
                    </p>
                  )}

                  {/* Creator */}
                  {creator && (
                    <ProfileHoverCard
                      username={creator.username ?? "anonymous"}
                      fullName={creator.full_name}
                      avatarUrl={creator.avatar_url}
                      bio={creator.bio}
                    />
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", alignItems: "flex-end", minWidth: "100px" }}>
                  {job.is_open ? (
                    user && profileComplete ? (
                      <ApplyButton jobId={String(job.id)} />
                    ) : user ? (
                      <a href="/profile" className="btn-neon btn-sm" style={{ fontSize: ".75rem" }}>
                        COMPLETE PROFILE
                      </a>
                    ) : (
                      <a href="/login" className="btn-neon btn-sm" style={{ fontSize: ".75rem" }}>
                        LOGIN TO APPLY
                      </a>
                    )
                  ) : (
                    <span className="mono text-dim" style={{ fontSize: ".7rem" }}>CLOSED</span>
                  )}
                  <a href={`/jobs/${job.id}`} className="btn-ghost btn-sm" style={{ fontSize: ".75rem" }}>
                    Details →
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
          borderRadius: "var(--radius)",
          background: "var(--surface-strong)",
        }}>
          <div className="display" style={{ fontSize: "2.5rem", color: "var(--text-2)", letterSpacing: ".08em" }}>
            NO JOBS FOUND
          </div>
          <p className="text-dim mono" style={{ fontSize: ".8rem", letterSpacing: ".05em", marginTop: ".75rem" }}>
            {q ? `No results for "${q}"` : "Check back soon — new gigs drop regularly"}
          </p>
        </div>
      )}
    </main>
  );
}