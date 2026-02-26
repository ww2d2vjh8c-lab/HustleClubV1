import { requireAdmin } from "@/lib/supabase/auth";
import { deleteListing, toggleListingPublished, toggleListingSold } from "./actions";

export const dynamic = "force-dynamic";

type ItemRow = {
  id: string;
  title: string;
  price: number | string | null;
  is_published: boolean;
  is_sold: boolean;
  created_at: string;
  seller_id: string | null;
};

export default async function AdminMarketplacePage() {
  const { supabase } = await requireAdmin();

  const { data: items, error } = await supabase
    .from("marketplace_items")
    .select(`
      id,
      title,
      price,
      is_published,
      is_sold,
      created_at,
      seller_id
    `)
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<ItemRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load marketplace listings.</p>
      </main>
    );
  }

  const sellerIds = [...new Set((items ?? []).map((item) => item.seller_id).filter(Boolean))] as string[];
  const { data: sellers } = sellerIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, full_name, email")
        .in("id", sellerIds)
    : { data: [] as { id: string; username: string | null; full_name: string | null; email: string | null }[] };

  const sellerById = new Map((sellers ?? []).map((seller) => [seller.id, seller]));

  const liveListings = items?.filter((item) => item.is_published && !item.is_sold).length ?? 0;
  const soldListings = items?.filter((item) => item.is_sold).length ?? 0;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Marketplace Moderation</h1>
        <p className="text-sm text-slate-600">Control listing visibility, sold state, and content quality platform-wide.</p>
      </header>

      <section className="app-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Total Listings" value={items?.length ?? 0} />
        <Metric label="Live Listings" value={liveListings} />
        <Metric label="Sold Listings" value={soldListings} />
        <Metric label="Draft/Hidden" value={(items?.length ?? 0) - liveListings - soldListings} />
      </section>

      <section className="space-y-3">
        {items?.map((item) => {
          const seller = item.seller_id ? sellerById.get(item.seller_id) : null;
          return (
            <article key={item.id} className="app-card rounded-xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="font-semibold text-lg">{item.title}</h2>
                  <p className="text-sm text-slate-600">
                    Seller: {seller?.full_name || seller?.username || seller?.email || "Unknown"}
                  </p>
                  <p className="text-sm text-slate-600">
                    Price: {item.price == null ? "—" : `Rs ${Number(item.price).toLocaleString()}`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleDateString()} · {item.is_published ? "Published" : "Hidden"} ·{" "}
                    {item.is_sold ? "Sold" : "Available"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleListingPublished(item.id);
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50">
                      {item.is_published ? "Hide" : "Publish"}
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await toggleListingSold(item.id);
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50">
                      {item.is_sold ? "Mark Unsold" : "Mark Sold"}
                    </button>
                  </form>

                  <form
                    action={async () => {
                      "use server";
                      await deleteListing(item.id);
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 text-sm hover:bg-rose-50">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}

        {items?.length === 0 ? (
          <div className="app-card rounded-xl p-6 text-slate-500">No marketplace items found.</div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
