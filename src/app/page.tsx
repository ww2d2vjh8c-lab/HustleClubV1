import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "5rem 0 4rem" }}>
        {/* decorative corner brackets */}
        <div style={{ position: "absolute", top: "2rem", left: "2rem", width: "40px", height: "40px",
          borderTop: "2px solid var(--neon-orange)", borderLeft: "2px solid var(--neon-orange)", opacity: .6 }} />
        <div style={{ position: "absolute", top: "2rem", right: "2rem", width: "40px", height: "40px",
          borderTop: "2px solid var(--neon-orange)", borderRight: "2px solid var(--neon-orange)", opacity: .6 }} />
        <div style={{ position: "absolute", bottom: "2rem", left: "2rem", width: "40px", height: "40px",
          borderBottom: "2px solid var(--neon-orange)", borderLeft: "2px solid var(--neon-orange)", opacity: .6 }} />
        <div style={{ position: "absolute", bottom: "2rem", right: "2rem", width: "40px", height: "40px",
          borderBottom: "2px solid var(--neon-orange)", borderRight: "2px solid var(--neon-orange)", opacity: .6 }} />

        <div className="app-container" style={{ position: "relative", zIndex: 1 }}>
          {/* eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: "1.5rem" }}>
            <div style={{ width: "32px", height: "2px", background: "var(--neon-orange)", boxShadow: "var(--glow-orange-sm)" }} />
            <span style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".7rem", letterSpacing: ".2em",
              color: "var(--neon-orange)", textTransform: "uppercase",
            }}>Creator Economy Platform · Est. 2024</span>
          </div>

          {/* main headline */}
          <h1 style={{
            fontFamily: "var(--font-display), 'Bebas Neue', cursive",
            fontSize: "clamp(3.5rem, 10vw, 7.5rem)",
            letterSpacing: ".04em",
            lineHeight: 1,
            margin: 0,
            color: "var(--text-0)",
          }}>
            JOIN THE{" "}
            <span style={{ color: "var(--neon-orange)", textShadow: "var(--glow-orange)" }}>HUSTLE.</span>
            <br />
            <span style={{ color: "var(--neon-cyan)", textShadow: "var(--glow-cyan)" }}>EARN</span>
            {" "}YOUR WAY.
          </h1>

          <p style={{
            maxWidth: "540px",
            marginTop: "1.5rem",
            fontSize: "1.05rem",
            lineHeight: 1.7,
            color: "var(--text-1)",
          }}>
            HustleClub is the underground creator economy — learn skills, land gigs, sell your work.
            One platform. Three revenue channels. Zero gatekeepers.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: ".75rem", marginTop: "2.5rem" }}>
            <Link href="/jobs" className="btn-neon-solid" style={{ fontSize: "1.05rem", padding: ".65rem 1.8rem" }}>
              ▶ FIND JOBS
            </Link>
            <Link href="/courses" className="btn-neon" style={{ fontSize: "1.05rem", padding: ".65rem 1.8rem" }}>
              LEARN SKILLS
            </Link>
            <Link href="/marketplace" className="btn-ghost" style={{ fontSize: "1rem", padding: ".65rem 1.6rem" }}>
              BROWSE MARKET →
            </Link>
          </div>

          {/* stats row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            marginTop: "3.5rem",
            maxWidth: "480px",
            border: "1px solid var(--line)",
            background: "var(--line)",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            {[
              { value: "3", label: "Revenue Channels" },
              { value: "∞", label: "Creator Potential" },
              { value: "Live", label: "Deployed & Real" },
            ].map(s => (
              <div key={s.label} style={{
                padding: "1rem 1.25rem",
                background: "var(--surface-strong)",
              }}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label" style={{ marginTop: ".25rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* divider */}
      <div className="app-container"><div className="neon-divider" /></div>

      {/* ── FEATURE CARDS ─────────────────────────────────────── */}
      <section className="app-container" style={{ padding: "3.5rem 0" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{
            fontFamily: "var(--font-display), cursive",
            fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
            letterSpacing: ".06em",
            margin: 0,
            color: "var(--text-0)",
          }}>THREE WAYS TO <span style={{ color: "var(--neon-orange)", textShadow: "var(--glow-orange-sm)" }}>GET PAID</span></h2>
          <p style={{ color: "var(--text-1)", marginTop: ".5rem", fontSize: ".95rem" }}>Pick your hustle. Stack your income.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1px",
          border: "1px solid var(--line)", borderRadius: "4px", overflow: "hidden", background: "var(--line)" }}>
          <FeatureCard
            tag="01"
            title="COURSES"
            description="Publish and sell your knowledge. Buyers enroll, learn, and level up — you get paid."
            href="/courses"
            cta="START LEARNING"
            accentColor="var(--neon-orange)"
            glowColor="var(--glow-orange-sm)"
          />
          <FeatureCard
            tag="02"
            title="JOBS"
            description="Post or land creator gigs. Apply in seconds, track decisions, manage your pipeline."
            href="/jobs"
            cta="SEE OPPORTUNITIES"
            accentColor="var(--neon-cyan)"
            glowColor="var(--glow-cyan)"
          />
          <FeatureCard
            tag="03"
            title="MARKETPLACE"
            description="Sell digital goods, templates, presets — anything. Instant delivery. Real orders."
            href="/marketplace"
            cta="BROWSE ITEMS"
            accentColor="var(--neon-pink)"
            glowColor="var(--glow-pink)"
          />
        </div>
      </section>

      {/* ── ROLE SECTION ──────────────────────────────────────── */}
      <section className="app-container" style={{ padding: "0 0 4rem" }}>
        <div style={{
          border: "1px solid var(--line)",
          background: "var(--surface-strong)",
          borderRadius: "4px",
          padding: "2rem 2.5rem",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* accent line */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px",
            background: "linear-gradient(90deg, var(--neon-orange), var(--neon-cyan), var(--neon-pink))",
            opacity: .6 }} />

          <h2 style={{
            fontFamily: "var(--font-display), cursive",
            fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
            letterSpacing: ".06em",
            margin: "0 0 .4rem",
          }}>
            BUILT FOR EVERY <span style={{ color: "var(--neon-orange)", textShadow: "var(--glow-orange-sm)" }}>PLAYER</span>
          </h2>
          <p style={{ color: "var(--text-1)", fontSize: ".9rem", marginBottom: "1.5rem" }}>
            Three roles. One ecosystem. Everyone eats.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1px",
            border: "1px solid var(--line)", borderRadius: "3px", overflow: "hidden", background: "var(--line)" }}>
            <RoleCard
              icon="👤"
              title="USER"
              detail="Enroll in courses, apply for jobs, buy from the marketplace."
              color="var(--text-1)"
            />
            <RoleCard
              icon="🎨"
              title="CREATOR"
              detail="Publish courses, post gigs, list goods. Get approved — then get paid."
              color="var(--neon-cyan)"
            />
            <RoleCard
              icon="⚡"
              title="ADMIN"
              detail="Approve creators, moderate content, track analytics, keep the platform clean."
              color="var(--neon-pink)"
            />
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <Link href="/signup" className="btn-neon-solid">
              CREATE YOUR ACCOUNT →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  tag, title, description, href, cta, accentColor, glowColor,
}: {
  tag: string; title: string; description: string;
  href: string; cta: string; accentColor: string; glowColor: string;
}) {
  return (
    <Link href={href} style={{
      display: "block", textDecoration: "none",
      background: "var(--surface-strong)",
      padding: "1.75rem",
      transition: "background 200ms ease",
    }}
    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
    onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-strong)")}
    >
      <span style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: ".65rem", letterSpacing: ".15em",
        color: accentColor, opacity: .7,
      }}>{tag}</span>

      <h3 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "2rem", letterSpacing: ".08em",
        color: accentColor,
        textShadow: glowColor,
        margin: ".4rem 0 .75rem",
      }}>{title}</h3>

      <p style={{ color: "var(--text-1)", fontSize: ".9rem", lineHeight: 1.65, margin: 0 }}>
        {description}
      </p>

      <span style={{
        display: "inline-block", marginTop: "1.25rem",
        fontFamily: "var(--font-display), cursive",
        fontSize: ".85rem", letterSpacing: ".1em",
        color: accentColor, opacity: .8,
      }}>
        {cta} →
      </span>
    </Link>
  );
}

function RoleCard({ icon, title, detail, color }: { icon: string; title: string; detail: string; color: string }) {
  return (
    <div style={{ padding: "1.25rem 1.5rem", background: "var(--surface-strong)" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>{icon}</div>
      <div style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.3rem", letterSpacing: ".1em",
        color,
      }}>{title}</div>
      <p style={{ color: "var(--text-1)", fontSize: ".83rem", lineHeight: 1.6, margin: ".35rem 0 0" }}>
        {detail}
      </p>
    </div>
  );
}
