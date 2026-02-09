import { requireUser } from "@/lib/auth/requireUser";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const { user, supabase } = await requireUser();

  const { data, error } = await supabase
    .from("marketplace_orders")
    .select(`
      id,
      price,
      status,
      created_at,
      item:marketplace_items(title, image_url)
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="p-6 text-red-500">Failed to load orders.</div>;
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {data?.map((o) => (
        <div key={o.id} className="border p-4 rounded">
          <p className="font-medium">{o.item?.[0]?.title}</p>
          <p className="text-sm text-gray-500">
            ₹{o.price} · {o.status}
          </p>
        </div>
      ))}
    </main>
  );
}