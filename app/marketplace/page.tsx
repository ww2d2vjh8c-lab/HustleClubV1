import { createSupabaseServerClient } from "@/lib/supabase/server";
import ItemGrid from "@/components/marketplace/ItemGrid";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = await createSupabaseServerClient();

  const { data: items, error } = await supabase
    .from("marketplace_items")
    .select(`
      id,
      title,
      price,
      image_url,
      seller:profiles (
        username,
        full_name,
        avatar_url
      )
    `)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load marketplace.
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-sm text-gray-600 mt-1">
          Buy & sell thrifted items from the community
        </p>
      </header>

      <ItemGrid items={items ?? []} />
    </main>
  );
}
