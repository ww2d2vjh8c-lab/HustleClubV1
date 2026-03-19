import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  price: number;
  status: string;
  created_at: string;
  buyer: { username: string | null; full_name: string | null }[] | null;
  item: { title: string }[] | null;
};

async function markOrderShipped(formData: FormData) {
  "use server";

  const { user, supabase } = await requireCreator();
  const orderId = formData.get("orderId") as string;

  if (!orderId) {
    throw new Error("Missing order id");
  }

  const { data: order, error } = await supabase
    .from("marketplace_orders")
    .select("id, status, seller_id")
    .eq("id", orderId)
    .single();

  if (error || !order || order.seller_id !== user.id) {
    throw new Error("Unauthorized");
  }

  if (order.status !== "paid") {
    throw new Error("Only paid orders can be marked as shipped");
  }

  const { error: updateError } = await supabase
    .from("marketplace_orders")
    .update({
      status: "shipped",
      shipped_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("seller_id", user.id);

  if (updateError) {
    throw new Error("Failed to mark order as shipped");
  }

  redirect("/creator/marketplace/orders");
}

export default async function CreatorMarketplaceOrdersPage() {
  const { user, supabase } = await requireCreator();

  const { data: orders, error } = await supabase
    .from("marketplace_orders")
    .select(`
      id,
      price,
      status,
      created_at,
      buyer:profiles!marketplace_orders_buyer_id_fkey(username, full_name),
      item:marketplace_items(title)
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-500">
        Failed to load marketplace orders.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace Orders</h1>
          <p className="text-sm text-gray-600">
            Track and fulfill incoming orders for your items.
          </p>
        </div>
      </header>

      {(!orders || orders.length === 0) && (
        <p className="text-gray-500">No orders yet.</p>
      )}

      <section className="space-y-4">
        {orders?.map((order) => {
          const buyer = order.buyer?.[0];
          const item = order.item?.[0];

          return (
            <div
              key={order.id}
              className="border rounded-xl p-5 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div>
                <p className="font-semibold">{item?.title ?? "Unknown item"}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Buyer: {buyer?.full_name || buyer?.username || "Unknown"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{order.price} · {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <OrderStatus status={order.status} />

                {order.status === "paid" && (
                  <form action={markOrderShipped}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="px-3 py-2 text-sm bg-black text-white rounded-md">
                      Mark as Shipped
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

function OrderStatus({ status }: { status: string }) {
  const cls =
    status === "paid"
      ? "bg-blue-100 text-blue-700"
      : status === "shipped"
        ? "bg-yellow-100 text-yellow-700"
        : status === "delivered"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700";

  return <span className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
}
