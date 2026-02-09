import { createSupabaseServerClient } from "@/lib/supabase/server";
import SellerCard from "@/components/marketplace/SellerCard";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();

  const { data: item } = await supabase
    .from("marketplace_items")
    .select(`
      id,
      title,
      description,
      price,
      image_url,
      seller:profiles (
        id,
        username,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq("id", params.id)
    .eq("is_published", true)
    .single();

  if (!item) {
    return (
      <div className="max-w-xl mx-auto p-6 text-red-500">
        Item not found.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
      <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden">
        {item.image_url && (
          <img
            src={item.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">
            {item.title}
          </h1>
          <p className="text-xl mt-2 font-semibold">
            ₹{item.price}
          </p>
        </div>

        <p className="text-gray-700">
          {item.description}
        </p>

        <SellerCard seller={item.seller} />
      </div>
    </main>
  );
}
