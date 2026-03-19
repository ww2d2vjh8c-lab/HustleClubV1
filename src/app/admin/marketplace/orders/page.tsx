import { requireAdmin } from "@/lib/supabase/auth";
import { setOrderStatus } from "./actions";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  price: number | string;
  status: "paid" | "shipped" | "delivered";
  created_at: string;
  item_id: string;
  buyer_id: string;
  seller_id: string;
};

export default async function AdminMarketplaceOrdersPage() {
  const { supabase } = await requireAdmin();

  const { data: orders, error } = await supabase
    .from("marketplace_orders")
    .select(`
      id,
      price,
      status,
      created_at,
      item_id,
      buyer_id,
      seller_id
    `)
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<OrderRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load orders.</p>
      </main>
    );
  }

  const itemIds = [...new Set((orders ?? []).map((order) => order.item_id))];
  const userIds = [...new Set((orders ?? []).flatMap((order) => [order.buyer_id, order.seller_id]))];

  const [{ data: items }, { data: users }] = await Promise.all([
    itemIds.length
      ? supabase
          .from("marketplace_items")
          .select("id, title")
          .in("id", itemIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    userIds.length
      ? supabase
          .from("profiles")
          .select("id, username, full_name, email")
          .in("id", userIds)
      : Promise.resolve({
          data: [] as { id: string; username: string | null; full_name: string | null; email: string | null }[],
        }),
  ]);

  const itemById = new Map((items ?? []).map((item) => [item.id, item]));
  const userById = new Map((users ?? []).map((profile) => [profile.id, profile]));

  const paid = orders?.filter((order) => order.status === "paid").length ?? 0;
  const shipped = orders?.filter((order) => order.status === "shipped").length ?? 0;
  const delivered = orders?.filter((order) => order.status === "delivered").length ?? 0;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Marketplace Orders</h1>
        <p className="text-sm text-slate-600">
          Control and audit the full order lifecycle across all sellers and buyers.
        </p>
      </header>

      <section className="app-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Metric label="Total Orders" value={orders?.length ?? 0} />
        <Metric label="Paid" value={paid} />
        <Metric label="Shipped" value={shipped} />
        <Metric label="Delivered" value={delivered} />
      </section>

      <section className="space-y-3">
        {orders?.map((order) => (
          <article key={order.id} className="app-card rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="font-semibold text-lg">{itemById.get(order.item_id)?.title ?? "Unknown item"}</h2>
                <p className="text-sm text-slate-600">
                  Buyer: {formatProfile(userById.get(order.buyer_id))} · Seller: {formatProfile(userById.get(order.seller_id))}
                </p>
                <p className="text-sm text-slate-600">
                  Amount: Rs {Number(order.price).toLocaleString()} · Status: {order.status}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(order.created_at).toLocaleString()} · Order ID: {order.id.slice(0, 8)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {order.status !== "paid" ? (
                  <form
                    action={async () => {
                      "use server";
                      await setOrderStatus(order.id, "paid");
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50">
                      Mark Paid
                    </button>
                  </form>
                ) : null}
                {order.status !== "shipped" ? (
                  <form
                    action={async () => {
                      "use server";
                      await setOrderStatus(order.id, "shipped");
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-slate-200 text-sm hover:bg-slate-50">
                      Mark Shipped
                    </button>
                  </form>
                ) : null}
                {order.status !== "delivered" ? (
                  <form
                    action={async () => {
                      "use server";
                      await setOrderStatus(order.id, "delivered");
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 text-sm hover:bg-emerald-50">
                      Mark Delivered
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        {orders?.length === 0 ? (
          <div className="app-card rounded-xl p-6 text-slate-500">No marketplace orders found.</div>
        ) : null}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function formatProfile(profile: { username: string | null; full_name: string | null; email: string | null } | undefined) {
  if (!profile) return "Unknown";
  return profile.full_name || profile.username || profile.email || "Unknown";
}
