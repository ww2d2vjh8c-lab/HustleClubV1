import { requireCreator } from "@/lib/supabase/requireCreator";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ItemRow = {
  id: string;
  title: string;
  price: number | null;
  is_published: boolean;
  is_sold: boolean;
  created_at: string;
};

export default async function CreatorMarketplacePage() {
  const { user, supabase } = await requireCreator();

  const { data: items, error } = await supabase
    .from("marketplace_items")
    .select(`
      id,
      title,
      price,
      is_published,
      is_sold,
      created_at
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ItemRow[]>();

  if (error) {
    console.log("MARKETPLACE DASHBOARD ERROR:", error);
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load marketplace items.
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-10">
      {/* HEADER */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Marketplace Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage your listed items
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/creator/marketplace/orders"
            className="px-4 py-2 border rounded-md text-sm"
          >
            Orders
          </Link>
          <Link
            href="/creator/marketplace/new"
            className="px-4 py-2 bg-black text-white rounded-md text-sm hover:bg-gray-800 transition"
          >
            Add Item
          </Link>
        </div>
      </header>

      {/* EMPTY STATE */}
      {(!items || items.length === 0) && (
        <p className="text-gray-500">
          You haven’t listed any items yet.
        </p>
      )}

      {/* ITEMS LIST */}
      <section className="space-y-4">
        {items?.map((item) => {
          let status = "Draft";
          let statusColor = "text-gray-500";

          if (item.is_sold) {
            status = "Sold";
            statusColor = "text-red-600";
          } else if (item.is_published) {
            status = "Published";
            statusColor = "text-green-600";
          }

          return (
            <div
              key={item.id}
              className="border rounded-xl p-6 bg-white flex justify-between items-center hover:shadow-sm transition"
            >
              <div>
                <h3 className="font-semibold text-lg">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-500">
                  ₹{item.price ?? 0}
                </p>

                <p className={`text-xs mt-1 ${statusColor}`}>
                  {status}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Created on{" "}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              <Link
                href={`/creator/marketplace/${item.id}`}
                className="text-sm underline"
              >
                Manage
              </Link>
            </div>
          );
        })}
      </section>
    </main>
  );
}
