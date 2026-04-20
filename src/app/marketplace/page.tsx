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
  searchParams?: Promise<{ q?: string; sort?: string }>;
};

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const supabase = await createSupabaseServerClient();
  const resolvedParams = (await searchParams) ?? {};
  const q = resolvedParams.q?.trim() ?? "";
  const sort = resolvedParams.sort ?? "newest";

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
    <main className="app-container" style={{ paddingBottom: "4rem" }}>
      {/* Page header */}
      <div className="page-header">
        <p className="section-tag" style={{ marginBottom: ".4rem" }}>Digital Goods</p>
        <h1 className="page-title">
          THE <span className="accent-pink">MARKET</span>
        </h1>
        <p className="page-subtitle">Curated digital goods from the HustleClub community.</p>
      </div>

      {/* Search bar */}
      <form style={{ display: "flex", gap: ".5rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search items..."
          className="field-input"
          style={{ flex: "1", minWidth: "200px" }}
        />
        <select
          name="sort"
          defaultValue={sort}
          className="field-input"
          style={{ width: "auto", minWidth: "140px", cursor: "pointer" }}
        >
          <option value="newest">Newest first</option>
          <option value="price_low">Price: low to high</option>
          <option value="price_high">Price: high to low</option>
        </select>
        <button type="submit" className="btn-neon" style={{
          borderColor: "var(--neon-pink)",
          color: "var(--neon-pink)",
          background: "rgba(255,0,153,.07)",
        }}>SEARCH</button>
      </form>

      {/* Items grid */}
      {items && items.length > 0 ? (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "1rem",
        }}>
          {items.map((item) => (
            <a
              key={item.id}
              href={`/marketplace/${item.id}`}
              className="app-card card-lift card-lift-pink"
              style={{ display: "block", overflow: "hidden", textDecoration: "none" }}
            >
              {/* Image */}
              <div style={{
                width: "100%",
                aspectRatio: "16/9",
                background: "var(--bg-1)",
                overflow: "hidden",
                position: "relative",
                borderBottom: "1px solid var(--line)",
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
                  <div className="display" style={{
                    width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "3rem", letterSpacing: ".1em",
                    color: "var(--text-2)",
                    background: "linear-gradient(135deg, var(--bg-1), var(--bg-2))",
                  }}>
                    {item.title.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "1rem 1.1rem 1.1rem" }}>
                <h3 style={{
                  fontFamily: "var(--font-display), cursive",
                  fontSize: "1.15rem",
                  letterSpacing: ".04em",
                  color: "var(--text-0)",
                  marginBottom: ".35rem",
                }}>
                  {item.title}
                </h3>

                {item.description && (
                  <p style={{
                    color: "var(--text-1)",
                    fontSize: ".8rem",
                    lineHeight: 1.55,
                    marginBottom: ".75rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>
                    {parseMarketplaceDescription(item.description)?.highlights ?? item.description.slice(0, 100)}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontFamily: "var(--font-display), cursive",
                    fontSize: "1.35rem",
                    letterSpacing: ".04em",
                    color: "var(--neon-green)",
                    textShadow: "0 0 8px rgba(0,232,122,.4)",
                  }}>
                    {item.price != null ? `₹${item.price.toLocaleString()}` : "FREE"}
                  </span>
                  <span className="mono text-dim" style={{ fontSize: ".7rem" }}>VIEW →</span>
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
          borderRadius: "var(--radius)",
          background: "var(--surface-strong)",
        }}>
          <div className="display" style={{ fontSize: "2.5rem", color: "var(--text-2)", letterSpacing: ".08em" }}>
            NOTHING HERE YET
          </div>
          <p className="text-dim mono" style={{ fontSize: ".8rem", letterSpacing: ".05em", marginTop: ".75rem" }}>
            {q ? `No results for "${q}"` : "The market is empty — be the first to list"}
          </p>
        </div>
      )}
    </main>
  );
}
