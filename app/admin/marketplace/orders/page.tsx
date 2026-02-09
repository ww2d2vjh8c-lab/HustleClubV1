import { requireUser } from "@/lib/auth/requireUser";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  price: number;
  status: string;
  created_at: string;
  item: { title: string }[];
  buyer: { username: string | null }[];
};

export default async function SellerOrdersPage() {
  // ✅ CORRECT USAGE
  const { user } = await requireUser();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("marketplace_orders")
    .select(`
      id,
      price,
      status,
      created_at,
      item:marketplace_items(title),
      buyer:profiles(username)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Failed to load orders.
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Orders Received</h1>

      {data?.map((o) => {
        const item = o.item[0];
        const buyer = o.buyer[0];

        return (
          <div key={o.id} className="border p-4 rounded">
            <p className="font-medium">
              {item?.title ?? "Unknown item"}
            </p>

            <p className="text-sm">
              Buyer: {buyer?.username ?? "Unknown"} · ₹{o.price}
            </p>

            <p className="text-xs text-gray-500">
              Status: {o.status}
            </p>
          </div>
        );
      })}
    </main>
  );
}