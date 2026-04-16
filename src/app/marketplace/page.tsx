import { createSupabaseServerClient } from "@/lib/supabase/server";
import Image from "next/image";
import { parseMarketplaceDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
};

type MarketplacePageProps = {
  searchParams?: {
    q?: string;
    sort?: string;
  };
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const supabase = await createSupabaseServerClient();
  const q = searchParams?.q?.trim() ?? "";
  const sort = searchParams?.sort ?? "newest";

  let query = supabase
    .from("marketplace_items")
    .select(`
      id,
      title,
      price,
      image_url,
      description,
      created_at
    `)
    .eq("is_published", true)
    .eq("is_sold", false);

  if (q) {
    const safeQ = q.replace(/[%,"']/g, " ").trim();
    if (safeQ) {
      query = query.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`);
    }
  }

  if (sort === "price_low") {
    query = query.order("price", { ascending: true });
  } else if (sort === "price_high") {
    query = query.order("price", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: items, error } = await query.returns<Item[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load marketplace.
      </div>
    );
  }

  return (
    <main className="app-container" style={{ padding: "2.5rem 0 4rem" }}>
      {/* Page header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: ".6rem", marginBottom: ".75rem" }}>
          <div style={{ width: "24px", height: "2px", background: "var(--neon-pink)", boxShadow: "var(--glow-pink)" }} />
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: ".65rem", letterSpacing: ".2em", color: "var(--neon-pink)", textTransform: "uppercase" }}>
            Digital Goods
          </span>
        </div>
        <h1 className="page-title">THE <span style={{ color: "var(--neon-pink)", textShadow: "var(--glow-pink)" }}>MARKET</span></h1>
        <p className="page-subtitle">Curated digital goods from the HustleClub community.</p>
      </div>

      {/* Search/sort bar */}
      <form style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: ".5rem", marginBottom: "2rem" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="SEARCH ITEMS..."
          style={{ padding: ".6rem 1rem", fontSize: ".85rem", fontFamily: "var(--font-mono), monospace", letterSpacing: ".05em" }}
        />
        <select name="sort" defaultValue={sort} style={{ padding: ".6rem .9rem", fontSize: ".85rem", cursor: "pointer" }}>
          <option value="newest">NEWEST</option>
          <option value="price_low">PRICE ↑</option>
          <option value="price_high">PRICE ↓</option>
        </select>
        <button type="submit" className="btn-neon" style={{ fontSize: ".85rem", borderColor: "var(--neon-pink)", color: "var(--neon-pink)", background: "rgba(255,0,204,.08)" }}>
          SEARCH
        </button>
      </form>

      {/* Items grid */}
      {items && items.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1px",
          border: "1px solid var(--line)",
          borderRadius: "4px",
          overflow: "hidden",
          background: "var(--line)",
        }}>
          {items.map((item) => (
            <a key={item.id} href={`/marketplace/${item.id}`} style={{
              display: "block",
              textDecoration: "none",
              background: "var(--surface-strong)",
              transition: "background 150ms ease",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-hover)")}
            onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-strong)")}
            >
              {/* Image */}
              <div style={{
                width: "100%",
                aspectRatio: "16/9",
                background: "var(--bg-1)",
                overflow: "hidden",
                borderBottom: "1px solid var(--line)",
                position: "relative",
              }}>
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-display), cursive",
                    fontSize: "3rem", letterSpacing: ".1em",
                    color: "var(--text-2)",
                  }}>
                    {item.title.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "1rem 1.25rem" }}>
                <h3 style={{
                  fontFamily: "var(--font-display), cursive",
                  fontSize: "1.2rem",
                  letterSpacing: ".05em",
                  margin: "0 0 .35rem",
                  color: "var(--text-0)",
                }}>{item.title}</h3>

                {item.description && (
                  <p style={{ color: "var(--text-1)", fontSize: ".8rem", lineHeight: 1.55, margin: "0 0 .75rem",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {parseMarketplaceDescription(item.description)?.highlights ?? item.description.slice(0, 80)}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontFamily: "var(--font-display), cursive",
                    fontSize: "1.4rem",
                    color: "var(--neon-green)",
                    textShadow: "var(--glow-green)",
                    letterSpacing: ".05em",
                  }}>
                    {item.price != null ? `₹${item.price.toLocaleString()}` : "FREE"}
                  </span>
                  <span style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: ".65rem",
                    color: "var(--text-2)",
                    letterSpacing: ".05em",
                  }}>
                    VIEW →
                  </span>
                </div>
              </div>
            </a>
          ))}
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
            NOTHING HERE YET
          </div>
          <p style={{ color: "var(--text-2)", marginTop: ".75rem", fontFamily: "var(--font-mono), monospace", fontSize: ".8rem" }}>
            {q ? `NO RESULTS FOR "${q.toUpperCase()}"` : "THE MARKET IS EMPTY — BE THE FIRST TO LIST"}
          </p>
        </div>
      )}
    </main>
  );
}
