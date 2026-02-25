import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Item = {
  id: number;
  title: string;
  price: number | null;
  image_url: string | null;
  created_at: string;
};

export default async function MarketplacePage() {
  const supabase = await createSupabaseServerClient();

  const { data: items, error } = await supabase
    .from("marketplace_items")
    .select(`
      id,
      title,
      price,
      image_url,
      created_at
    `)
    .eq("is_published", true)
    .eq("is_sold", false)
    .order("created_at", { ascending: false })
    .returns<Item[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load marketplace.
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <header>
        <h1 className="text-3xl font-bold">
          Marketplace
        </h1>
        <p className="text-gray-600 mt-2">
          Browse available items
        </p>
      </header>

      {(!items || items.length === 0) && (
        <p className="text-gray-500">
          No items available right now.
        </p>
      )}

      <section className="grid md:grid-cols-3 gap-6">
        {items?.map((item) => (
          <Link
            key={item.id}
            href={`/marketplace/${item.id}`}
            className="border rounded-xl p-5 bg-white hover:shadow-md transition"
          >
            {item.image_url && (
              <div className="mb-4 h-40 bg-gray-100 rounded overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h2 className="font-semibold text-lg">
              {item.title}
            </h2>

            <p className="text-sm text-gray-600 mt-2">
              ₹{item.price ?? 0}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}