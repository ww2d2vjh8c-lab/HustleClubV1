import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BuyButton from "@/components/marketplace/BuyButton";
import { parseMarketplaceDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (error || !item) notFound();

  const parsed = parseMarketplaceDescription(item.description);
  const isOwner = user?.id === item.seller_id;

  const [sellerResult, isPurchasedResult, relatedResult] = await Promise.all([
    item.seller_id
      ? supabase
          .from("profiles")
          .select("id, username, full_name, is_verified, created_at")
          .eq("id", item.seller_id)
          .single()
      : Promise.resolve({ data: null }),

    user && !isOwner
      ? supabase
          .from("marketplace_orders")
          .select("id")
          .eq("item_id", id)
          .eq("buyer_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),

    item.seller_id
      ? supabase
          .from("marketplace_items")
          .select("id, title, price, image_url")
          .eq("seller_id", item.seller_id)
          .eq("is_published", true)
          .neq("id", id)
          .limit(3)
      : Promise.resolve({ data: [] }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seller = sellerResult.data as any;
  const isPurchased = !!isPurchasedResult.data;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relatedItems: any[] = relatedResult.data ?? [];

  const sellerInitials = (seller?.full_name ?? seller?.username ?? "?")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const memberYear = seller?.created_at
    ? new Date(seller.created_at).getFullYear()
    : null;

  return (
    <main className="app-container" style={{ paddingBottom: "6rem" }}>

      {/* ── OWNER BANNER ── */}
      {isOwner && (
        <div style={{
          margin: "1rem 0",
          padding: ".6rem 1.25rem",
          background: "rgba(255,102,0,.08)",
          border: "1px solid rgba(255,102,0,.2)",
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <span style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: ".6rem",
            letterSpacing: ".15em",
            color: "var(--neon-orange)",
          }}>
            ▸ YOUR LISTING
          </span>
          <Link href="/creator/marketplace" style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: ".65rem",
            color: "var(--text-1)",
            textDecoration: "none",
          }}>
            Manage listings →
          </Link>
        </div>
      )}

      {/* ── BACK LINK ── */}
      <div style={{ marginBottom: "1.25rem", marginTop: isOwner ? ".5rem" : "1rem" }}>
        <Link href="/marketplace" style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: ".7rem",
          letterSpacing: ".1em",
          color: "var(--text-2)",
          textDecoration: "none",
        }}>
          ← Back to Market
        </Link>
      </div>

      {/* ── HERO ── */}
      <div style={{
        position: "relative",
        width: "100%",
        height: "380px",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        marginBottom: "2.5rem",
        border: "1px solid var(--line)",
        background: "linear-gradient(135deg, #1a001a 0%, #00001a 50%, #0d1a00 100%)",
      }}>
        {item.image_url && (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 1200px"
            style={{ objectFit: "cover" }}
            priority
          />
        )}

        {/* gradient overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(7,7,15,0.92) 0%, rgba(7,7,15,0.5) 50%, rgba(7,7,15,0.15) 100%)",
        }} />

        {/* bottom-left content */}
        <div style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          padding: "1.75rem 2rem",
        }}>
          <span className="tag tag-pink" style={{ marginBottom: ".75rem", display: "inline-block" }}>
            MARKETPLACE ITEM
          </span>
          <h1 className="display" style={{
            fontSize: "clamp(1.6rem, 4.5vw, 2.6rem)",
            letterSpacing: ".04em",
            color: "var(--text-0)",
            lineHeight: 1.15,
            marginBottom: ".5rem",
            maxWidth: "700px",
            textShadow: "0 2px 20px rgba(0,0,0,.7)",
          }}>
            {item.title}
          </h1>
          {seller && (
            <span style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".68rem",
              letterSpacing: ".12em",
              color: "rgba(240,234,214,.55)",
            }}>
              by {seller.full_name ?? seller.username ?? "Unknown"}
              {seller.is_verified ? " ✓" : ""}
            </span>
          )}
        </div>
      </div>

      {/* ── 2-COLUMN GRID ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 300px",
        gap: "2.5rem",
        alignItems: "start",
      }}>

        {/* ════ LEFT ════ */}
        <section>

          {/* SELLER CARD */}
          {seller && (
            <div className="app-card" style={{
              borderLeft: "3px solid var(--neon-pink)",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: ".9rem" }}>
                {/* Avatar */}
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--neon-pink), rgba(255,102,0,.6))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "var(--font-mono), monospace",
                  fontSize: ".85rem",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: ".05em",
                }}>
                  {sellerInitials}
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".5rem", marginBottom: ".2rem" }}>
                    <span style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: ".8rem",
                      color: "var(--text-0)",
                      letterSpacing: ".02em",
                    }}>
                      {seller.full_name ?? seller.username ?? "Unknown Seller"}
                    </span>
                    {seller.is_verified && (
                      <span style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: ".58rem",
                        letterSpacing: ".08em",
                        color: "var(--neon-green)",
                        background: "rgba(0,232,122,.1)",
                        border: "1px solid rgba(0,232,122,.25)",
                        borderRadius: "999px",
                        padding: ".1rem .45rem",
                      }}>
                        VERIFIED ✓
                      </span>
                    )}
                  </div>
                  {seller.username && (
                    <span style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: ".68rem",
                      color: "var(--neon-pink)",
                      letterSpacing: ".08em",
                    }}>
                      @{seller.username}
                    </span>
                  )}
                </div>
              </div>

              {/* Member Since */}
              {memberYear && (
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: ".55rem",
                    letterSpacing: ".18em",
                    color: "var(--text-2)",
                    textTransform: "uppercase",
                    marginBottom: ".15rem",
                  }}>
                    MEMBER SINCE
                  </div>
                  <div style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontSize: ".75rem",
                    color: "var(--text-1)",
                    letterSpacing: ".08em",
                  }}>
                    {memberYear}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* META TAGS ROW */}
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
            <span className="tag tag-pink">FOR SALE</span>
            {item.is_sold && (
              <span className="tag tag-muted" style={{ textDecoration: "line-through" }}>SOLD</span>
            )}
            <span className="tag tag-muted" style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".6rem",
            }}>
              Listed {daysAgo(item.created_at)}
            </span>
          </div>

          {/* HIGHLIGHTS */}
          {parsed.highlights && (
            <p style={{
              color: "var(--text-1)",
              fontSize: ".95rem",
              lineHeight: 1.8,
              marginBottom: "2rem",
              maxWidth: "640px",
            }}>
              {parsed.highlights}
            </p>
          )}

          {/* CONTENT SECTIONS */}
          <ItemTextSection title="Condition" content={parsed.conditionDetails} />
          <ItemListSection title="Specifications" items={parsed.specifications} />
          <ItemTextSection title="Shipping" content={parsed.shipping} />
          <ItemTextSection title="Why Selling" content={parsed.whySelling} />

          {/* ACTIVITY BAR */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            padding: "1rem 1.25rem",
            marginTop: "2rem",
          }}>
            {[
              { icon: "👁", label: "View count not tracked" },
              { icon: "🗓", label: `Listed ${daysAgo(item.created_at)}` },
              { icon: "🔒", label: "Secure checkout" },
              { icon: "📦", label: "Direct delivery" },
            ].map(({ icon, label }) => (
              <div key={label} style={{
                display: "flex",
                alignItems: "center",
                gap: ".4rem",
                fontFamily: "var(--font-mono), monospace",
                fontSize: ".72rem",
                color: "var(--text-2)",
                letterSpacing: ".05em",
              }}>
                <span style={{ fontSize: ".8rem" }}>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ════ RIGHT SIDEBAR ════ */}
        <aside style={{ position: "sticky", top: "80px" }}>
          <div className="app-card" style={{
            borderTop: "2px solid var(--neon-pink)",
            padding: "1.5rem",
          }}>
            {/* PRICE LABEL */}
            <div style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: ".58rem",
              letterSpacing: ".15em",
              textTransform: "uppercase",
              color: "var(--text-2)",
              marginBottom: ".4rem",
            }}>
              PRICE
            </div>

            {/* PRICE VALUE */}
            <div style={{
              fontFamily: "var(--font-display), cursive",
              fontSize: "2.4rem",
              letterSpacing: ".04em",
              color: "var(--neon-pink)",
              marginBottom: "1.25rem",
              textShadow: "0 0 20px rgba(255,0,153,.3)",
              lineHeight: 1,
            }}>
              ₹{item.price?.toLocaleString() ?? "0"}
            </div>

            {/* FEATURE BULLETS */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: ".45rem",
              marginBottom: "1.5rem",
            }}>
              {[
                `Seller: ${seller?.full_name ?? seller?.username ?? "Community Seller"}`,
                "Secure order tracking",
                "Instant delivery after payment",
                "Buyer protection guaranteed",
              ].map((feat) => (
                <div key={feat} style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: ".5rem",
                  fontSize: ".8rem",
                  color: "var(--text-1)",
                  lineHeight: 1.45,
                }}>
                  <span style={{
                    color: "var(--neon-pink)",
                    fontSize: ".75rem",
                    flexShrink: 0,
                    marginTop: ".05rem",
                  }}>›</span>
                  {feat}
                </div>
              ))}
            </div>

            {/* CTA STATE MACHINE */}
            {isOwner ? (
              <Link href="/creator/marketplace" className="btn-ghost" style={{
                display: "block",
                textAlign: "center",
              }}>
                MANAGE LISTING →
              </Link>
            ) : item.is_sold ? (
              <div style={{
                padding: ".75rem 1rem",
                borderRadius: "var(--radius-sm)",
                textAlign: "center",
                background: "rgba(255,0,153,.12)",
                border: "1px solid rgba(255,0,153,.3)",
                color: "var(--neon-pink)",
                fontFamily: "var(--font-mono), monospace",
                fontSize: ".7rem",
                letterSpacing: ".12em",
              }}>
                SOLD — NO LONGER AVAILABLE
              </div>
            ) : isPurchased ? (
              <div style={{
                padding: ".75rem 1rem",
                borderRadius: "var(--radius-sm)",
                textAlign: "center",
                background: "rgba(0,232,122,.08)",
                border: "1px solid rgba(0,232,122,.25)",
                color: "var(--neon-green)",
                fontFamily: "var(--font-mono), monospace",
                fontSize: ".7rem",
                letterSpacing: ".12em",
              }}>
                ✓ ALREADY PURCHASED
              </div>
            ) : user ? (
              <BuyButton itemId={item.id} />
            ) : (
              <Link href="/login" className="btn-neon-solid" style={{
                display: "block",
                textAlign: "center",
              }}>
                LOGIN TO BUY →
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* ── MORE FROM SELLER ── */}
      {relatedItems.length > 0 && (
        <div style={{
          borderTop: "1px solid var(--line)",
          marginTop: "4rem",
          paddingTop: "2.5rem",
        }}>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: ".6rem",
            letterSpacing: ".2em",
            color: "var(--text-2)",
            textTransform: "uppercase",
            marginBottom: ".4rem",
          }}>
            MORE FROM SELLER
          </div>
          <h2 className="display" style={{
            fontSize: "1.4rem",
            letterSpacing: ".06em",
            color: "var(--text-0)",
            marginBottom: "1.25rem",
          }}>
            OTHER LISTINGS
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
          }}>
            {relatedItems.map((rel) => (
              <Link
                key={rel.id}
                href={`/marketplace/${rel.id}`}
                style={{ textDecoration: "none" }}
              >
                <div className="app-card card-lift-pink" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{
                    position: "relative",
                    width: "100%",
                    height: "140px",
                    background: "linear-gradient(135deg, #1a001a 0%, #00001a 100%)",
                  }}>
                    {rel.image_url && (
                      <Image
                        src={rel.image_url}
                        alt={rel.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div style={{ padding: ".85rem 1rem" }}>
                    <div style={{
                      fontSize: ".8rem",
                      color: "var(--text-0)",
                      marginBottom: ".35rem",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {rel.title}
                    </div>
                    <div style={{
                      fontFamily: "var(--font-mono), monospace",
                      fontSize: ".78rem",
                      color: "var(--neon-pink)",
                      letterSpacing: ".04em",
                    }}>
                      ₹{rel.price?.toLocaleString() ?? "0"}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function ItemTextSection({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <h2 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.05rem",
        letterSpacing: ".06em",
        textTransform: "uppercase",
        color: "var(--text-0)",
        marginBottom: ".65rem",
        paddingBottom: ".4rem",
        borderBottom: "1px solid var(--line)",
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: ".875rem",
        color: "var(--text-1)",
        lineHeight: 1.7,
      }}>
        {content}
      </p>
    </section>
  );
}

function ItemListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <h2 style={{
        fontFamily: "var(--font-display), cursive",
        fontSize: "1.05rem",
        letterSpacing: ".06em",
        textTransform: "uppercase",
        color: "var(--text-0)",
        marginBottom: ".65rem",
        paddingBottom: ".4rem",
        borderBottom: "1px solid var(--line)",
      }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: ".4rem" }}>
        {items.map((spec, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: ".65rem",
            padding: ".6rem .85rem",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-sm)",
            fontSize: ".875rem",
            color: "var(--text-1)",
            lineHeight: 1.55,
          }}>
            <span style={{
              color: "var(--neon-pink)",
              fontSize: ".65rem",
              marginTop: ".25rem",
              flexShrink: 0,
            }}>▸</span>
            {spec}
          </div>
        ))}
      </div>
    </section>
  );
}
