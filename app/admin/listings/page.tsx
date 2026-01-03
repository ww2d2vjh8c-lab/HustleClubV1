import { requireAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  const { supabase } = await requireAdmin();

  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, title, price, created_at")
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
      <h1 className="text-2xl font-bold mb-4">Admin · Listings</h1>

      {listings && listings.length === 0 && (
        <p className="text-gray-600">No listings found.</p>
      )}

      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2 text-left">Title</th>
            <th className="border px-3 py-2 text-left">Price</th>
            <th className="border px-3 py-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {listings?.map((listing) => (
            <tr key={listing.id}>
              <td className="border px-3 py-2">{listing.title}</td>
              <td className="border px-3 py-2">
                {listing.price ? `₹${listing.price}` : "—"}
              </td>
              <td className="border px-3 py-2">
                {new Date(listing.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
