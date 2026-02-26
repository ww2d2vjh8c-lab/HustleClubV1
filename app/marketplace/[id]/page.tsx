import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BuyButton from "@/components/marketplace/BuyButton";
import { parseMarketplaceDescription } from "@/lib/content/richContent";

export const dynamic = "force-dynamic";

export default async function MarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ UUID string

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!id) {
    notFound();
  }

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", id) // ✅ no Number()
    .eq("is_published", true)
    .single();

  if (error || !item) {
    notFound();
  }
  const parsed = parseMarketplaceDescription(item.description);
  const { data: seller } = item.seller_id
    ? await supabase
        .from("profiles")
        .select("username, full_name, is_verified")
        .eq("id", item.seller_id)
        .single()
    : { data: null };

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <section className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">{item.title}</h1>
            <p className="text-gray-500 text-sm">
              Listed on {new Date(item.created_at).toLocaleDateString()}
            </p>
          </header>

          {item.image_url && (
            <div className="relative h-80 bg-gray-100 rounded-xl overflow-hidden">
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, 896px"
                className="object-cover"
              />
            </div>
          )}

          <p className="text-gray-700">
            {parsed.highlights || "Quality product listed by a verified community member."}
          </p>

          <MarketplaceSection title="Condition" content={parsed.conditionDetails} />
          <MarketplaceListSection title="Specifications" items={parsed.specifications} />
          <MarketplaceSection title="Shipping" content={parsed.shipping} />
          <MarketplaceSection title="Why Selling" content={parsed.whySelling} />
        </section>

        <aside className="rounded-xl border bg-white p-5 space-y-4 lg:sticky lg:top-24">
          <p className="text-xs uppercase tracking-wide text-gray-500">Price</p>
          <p className="text-3xl font-bold">₹{item.price ?? 0}</p>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              Seller: {seller?.full_name || seller?.username || "Community Seller"}
              {seller?.is_verified ? " (Verified)" : ""}
            </p>
            <p>Secure order tracking</p>
            <p>No self-purchase allowed</p>
          </div>

          {!item.is_sold ? (
            user ? (
              <BuyButton itemId={item.id} />
            ) : (
              <Link href="/login" className="text-blue-600 font-medium">
                Login to buy
              </Link>
            )
          ) : (
            <div className="text-red-600 font-medium">
              This item has been sold.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function MarketplaceSection({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <section className="space-y-1">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-gray-700">{content}</p>
    </section>
  );
}

function MarketplaceListSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="border rounded-lg p-3 bg-white text-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
