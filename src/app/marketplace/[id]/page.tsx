import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BuyButton from "@/components/marketplace/BuyButton";
import { parseMarketplaceDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ UUID string

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!id) {
    notFound();
  }

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", id) // ✅ no Number()
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }
  const parsed = parseMarketplaceDescription(item.description);
  const { data: seller } = item.seller_id
    ? await supabase
        .from("profiles")
        .select("username, full_name, is_verified")
        .eq("id", item.seller_id)
        .single()
    : { data: null };

  return (
    <main className="app-container" style={{ paddingBottom: "5rem" }}>

      {/* ── BACK LINK ── */}
      <div style={{ marginBottom: "1.5rem", marginTop: "1rem" }}>
        <Link href="/marketplace" style={{
          fontFamily: "var(--font-mono), monospace", fontSize: ".7rem",
          letterSpacing: ".1em", color: "var(--text-2)", textDecoration: "none",
        }}>
          ← Back to Market
        </Link>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: "2rem",
        alignItems: "start",
      }}>

        {/* ── LEFT: ITEM CONTENT ── */}
        <section>
          {/* Image */}
          {item.image_url && (
            <div style={{
              position: "relative", width: "100%", height: "340px",
              borderRadius: "var(--radius)", overflow: "hidden",
              marginBottom: "1.75rem", border: "1px solid var(--line)",
              background: "linear-gradient(135deg, #1a001a, var(--bg-1))",
            }}>
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                style={{ objectFit: "cover" }}
              />
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: "1.5rem" }}>
            {seller && (
              <span style={{ fontSize: ".72rem", color: "var(--neon-pink)", display: "block", marginBottom: ".35rem" }}>
                {seller.username ? `@${seller.username}` : seller.full_name ?? "Seller"}
                {seller.is_verified ? " ✓" : ""}
              </span>
            )}
            <h1 className="display" style={{
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)", letterSpacing: ".04em",
              color: "var(--text-0)", marginBottom: ".5rem", lineHeight: 1.2,
            }}>
              {item.title}
            </h1>
            <p className="mono" style={{ fontSize: ".65rem", color: "var(--text-2)", letterSpacing: ".1em" }}>
              Listed {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* Description */}
          {parsed.highlights && (
            <p style={{
              color: "var(--text-1)", fontSize: ".95rem", lineHeight: 1.75,
              marginBottom: "1.75rem", maxWidth: "640px",
            }}>
              {parsed.highlights}
            </p>
          )}

          <ItemTextSection title="Condition" content={parsed.conditionDetails} />
          <ItemListSection title="Specifications" items={parsed.specifications} />
          <ItemTextSection title="Shipping" content={parsed.shipping} />
          <ItemTextSection title="Why Selling" content={parsed.whySelling} />
        </section>

        {/* ── RIGHT: BUY SIDEBAR ── */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <div className="app-card" style={{ borderTop: "2px solid var(--neon-pink)", padding: "1.5rem" }}>
            <div style={{
              fontFamily: "var(--font-mono), monospace", fontSize: ".58rem",
              letterSpacing: ".15em", textTransform: "uppercase",
              color: "var(--text-2)", marginBottom: ".5rem",
            }}>
              Price
            </div>

            <div style={{
              fontFamily: "var(--font-display), cursive",
              fontSize: "2rem", letterSpacing: ".04em",
              color: "var(--neon-pink)", marginBottom: ".25rem",
              textShadow: "0 0 16px rgba(255,0,153,.3)",
            }}>
              ₹{item.price?.toLocaleString() ?? "0"}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: ".4rem", marginBottom: "1.25rem" }}>
              {[
                `Seller: ${seller?.full_name ?? seller?.username ?? "Community Seller"}`,
                "Secure order tracking",
                "Instant delivery",
              ].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: ".5rem", fontSize: ".8rem", color: "var(--text-1)" }}>
                  <span style={{ color: "var(--neon-pink)", fontSize: ".65rem" }}>›</span>
                  {f}
                </div>
              ))}
            </div>

            {item.is_sold ? (
              <div style={{
                padding: ".6rem 1rem", borderRadius: "var(--radius-sm)", textAlign: "center",
                background: "rgba(255,0,153,.08)", border: "1px solid rgba(255,0,153,.25)",
                color: "var(--neon-pink)", fontFamily: "var(--font-mono), monospace",
                fontSize: ".72rem", letterSpacing: ".1em",
              }}>
                SOLD
              </div>
            ) : user ? (
              <BuyButton itemId={item.id} />
            ) : (
              <Link href="/login" className="btn-neon-solid" style={{
                display: "block", textAlign: "center",
                background: "rgba(255,0,153,.15)", borderColor: "var(--neon-pink)", color: "var(--neon-pink)",
              }}>
                LOGIN TO BUY →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function ItemTextSection({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.05rem", letterSpacing: ".06em",
        color: "var(--text-0)", marginBottom: ".6rem",
        paddingBottom: ".35rem", borderBottom: "1px solid var(--line)",
      }}>
        {title.toUpperCase()}
      </h2>
      <p style={{ fontSize: ".875rem", color: "var(--text-1)", lineHeight: 1.65 }}>{content}</p>
    </section>
  );
}

function ItemListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.05rem", letterSpacing: ".06em",
        color: "var(--text-0)", marginBottom: ".6rem",
        paddingBottom: ".35rem", borderBottom: "1px solid var(--line)",
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
            <span style={{ color: "var(--neon-pink)", fontSize: ".65rem", marginTop: ".2rem", flexShrink: 0 }}>▸</span>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
