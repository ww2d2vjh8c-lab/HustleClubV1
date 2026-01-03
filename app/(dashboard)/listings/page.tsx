import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ListingsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, description, price, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load listings</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Marketplace Listings</h1>

      {listings && listings.length === 0 && (
        <p className="text-gray-600">No listings available yet.</p>
      )}

      <ul className="space-y-4">
        {listings?.map((listing) => (
          <li
            key={listing.id}
            className="border rounded p-4 hover:bg-gray-50"
          >
            <h2 className="text-lg font-semibold">{listing.title}</h2>

            {listing.description && (
              <p className="text-gray-600 mt-1">
                {listing.description}
              </p>
            )}

            {listing.price && (
              <p className="mt-2 font-medium">
                ₹{listing.price}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
