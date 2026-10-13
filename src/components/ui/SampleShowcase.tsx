import Link from "next/link";
import { SAMPLE_LISTINGS, type SampleKind } from "@/lib/demo/samples";

const CTA: Record<SampleKind, { href: string; label: string }> = {
  courses: { href: "/creator/apply", label: "Publish a course →" },
  jobs: { href: "/jobs/new", label: "Post a job →" },
  marketplace: { href: "/marketplace/sell", label: "List an item →" },
};

export default function SampleShowcase({
  kind,
  reason = "empty",
}: {
  kind: SampleKind;
  reason?: "empty" | "error";
}) {
  const cta = CTA[kind];

  return (
    <section>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: ".75rem",
        padding: ".85rem 1rem", marginBottom: "1rem",
        border: "1px dashed var(--line)", borderRadius: "var(--radius-sm)",
        background: "var(--surface)",
      }}>
        <p className="mono text-dim" style={{ fontSize: ".72rem", letterSpacing: ".05em", margin: 0 }}>
          {reason === "error"
            ? "Live listings couldn't load right now. Here are some examples of what you'll find."
            : "Nothing listed yet. Here are some examples of what you'll find."}
        </p>
        <Link href={cta.href} className="btn-neon btn-sm">{cta.label}</Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
        gap: "1rem",
      }}>
        {SAMPLE_LISTINGS[kind].map((item) => (
          <article
            key={item.title}
            className="app-card"
            aria-label={`Example listing: ${item.title}`}
            style={{ overflow: "hidden", opacity: 0.92 }}
          >
            <div className="display" style={{
              position: "relative", aspectRatio: "16/9",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2.5rem", color: "var(--text-2)",
              background: "linear-gradient(135deg, var(--bg-1), var(--bg-2))",
              borderBottom: "1px solid var(--line)",
            }}>
              {item.title.slice(0, 2).toUpperCase()}
              <span className="tag tag-muted" style={{ position: "absolute", top: ".6rem", left: ".6rem" }}>
                Example
              </span>
            </div>

            <div style={{ padding: ".85rem 1rem 1rem" }}>
              <h3 className="display" style={{ fontSize: "1.05rem", letterSpacing: ".04em", color: "var(--text-0)", marginBottom: ".25rem" }}>
                {item.title}
              </h3>
              <span style={{ fontSize: ".72rem", color: "var(--neon-orange)" }}>{item.byline}</span>
              <p style={{ color: "var(--text-1)", fontSize: ".8rem", lineHeight: 1.55, margin: ".5rem 0 .75rem" }}>
                {item.summary}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".5rem", flexWrap: "wrap" }}>
                <span style={{
                  fontFamily: "var(--font-display), cursive", fontSize: "1.15rem",
                  color: "var(--neon-green)", textShadow: "0 0 8px rgba(0,232,122,.3)",
                }}>
                  {item.price ? `₹${item.price.toLocaleString("en-IN")}` : "FREE"}
                </span>
                <span style={{ display: "flex", gap: ".3rem", flexWrap: "wrap" }}>
                  {item.tags.map((t) => <span key={t} className="tag tag-muted">{t}</span>)}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
