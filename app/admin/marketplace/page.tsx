import { requireCreator } from "@/lib/auth/requireCreator";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminMarketplacePage() {
  const user = await requireCreator("/admin/marketplace");
  const supabase = await createSupabaseServerClient();

  const { data: items, error } = await supabase
    .from("marketplace_items")
    .select("id, title, price, created_at")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Failed to load marketplace items.
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Marketplace Items</h1>

        <Link
          href="/marketplace/sell"
          className="px-4 py-2 rounded bg-black text-white text-sm"
        >
          + New Item
        </Link>
      </header>

      {(!items || items.length === 0) && (
        <p className="text-gray-500">
          You haven’t listed any items yet.
        </p>
      )}

      <section className="space-y-4">
        {items?.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg p-4 bg-white"
          >
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-gray-600">₹{item.price}</p>
            <p className="text-xs text-gray-400">
              Posted on{" "}
              {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
