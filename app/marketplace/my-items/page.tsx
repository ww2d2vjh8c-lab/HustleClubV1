import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MarketplaceCard from "@/components/marketplace/MarketplaceCard";
import CardSkeleton from "@/components/ui/CardSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MyItemsPage() {
  const user = await requireUser("/marketplace/my-items");
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("marketplace_items")
    .select("id, title, price, image_url, is_published")
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  if (!data && !error) {
    return (
      <section className="grid grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-12">
        <EmptyState
          title="No items yet"
          description="Create your first marketplace listing."
          action={
            <Link
              href="/marketplace/sell"
              className="inline-block px-4 py-2 bg-black text-white rounded"
            >
              Sell an item
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Items</h1>
        <Link
          href="/marketplace/sell"
          className="px-4 py-2 rounded bg-black text-white"
        >
          Sell Item
        </Link>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {data.map((item) => (
          <MarketplaceCard
            key={item.id}
            id={item.id}
            title={item.title}
            price={item.price}
            imageUrl={item.image_url}
            isPublished={item.is_published}
          />
        ))}
      </section>
    </main>
  );
}
