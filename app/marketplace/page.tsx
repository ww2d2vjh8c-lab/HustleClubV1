import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
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
    console.log("MARKETPLACE ERROR:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load marketplace.
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      {/* HEADER */}
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-gray-600">
          Discover curated items from our community
        </p>
      </header>

      <form className="grid gap-3 md:grid-cols-[1fr_200px_120px]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search products, keywords..."
          className="w-full border rounded-lg px-3 py-2"
        />
        <select name="sort" defaultValue={sort} className="w-full border rounded-lg px-3 py-2">
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
        <button className="rounded-lg bg-black text-white px-4 py-2">Search</button>
      </form>

      {/* EMPTY STATE */}
      {(!items || items.length === 0) && (
        <div className="border rounded-xl p-10 text-center bg-gray-50">
          <p className="text-gray-500">
            No items available right now.
          </p>
        </div>
      )}

      {/* GRID */}
      <section className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items?.map((item) => (
          <Link
            key={item.id}
            href={`/marketplace/${item.id}`}
            className="group border rounded-xl bg-white overflow-hidden hover:shadow-lg transition"
          >
            {/* IMAGE */}
            <div className="h-48 bg-gray-100 overflow-hidden">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.title}
                  width={600}
                  height={400}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No Image
                </div>
              )}
            </div>

            {/* CONTENT */}
            <div className="p-5 space-y-2">
              <h2 className="font-semibold text-lg group-hover:underline">
                {item.title}
              </h2>

              <p className="text-sm text-gray-500 line-clamp-2">
                {parseMarketplaceDescription(item.description).highlights || "Verified community listing"}
              </p>

              <p className="text-sm text-gray-600">
                ₹{item.price ? item.price.toLocaleString() : "0"}
              </p>

              <p className="text-sm font-medium">View product →</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
