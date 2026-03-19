import { requireUser } from "@/lib/auth/requireUser";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  price: number | string;
  status: string;
  created_at: string;
  item_id: string;
};

type ItemRow = {
  id: string;
  title: string;
  image_url: string | null;
};

type TxRow = {
  id: string;
  order_id: string | null;
  provider: string;
  status: string;
};

type PendingTxRow = {
  id: string;
  item_id: string;
  provider: string;
  status: string;
  amount: number | string;
  currency: string;
  checkout_url: string | null;
  error_message: string | null;
  created_at: string;
  reservation_expires_at: string | null;
};

export default async function MyOrdersPage() {
  const { user, supabase } = await requireUser();

  const { data: orders, error } = await supabase
    .from("marketplace_orders")
    .select("id, price, status, created_at, item_id")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  if (error) {
    return <div className="p-6 text-red-500">Failed to load orders.</div>;
  }

  const { data: pendingTransactions } = await supabase
    .from("payment_transactions")
    .select(
      "id, item_id, provider, status, amount, currency, checkout_url, error_message, created_at, reservation_expires_at"
    )
    .eq("buyer_id", user.id)
    .is("order_id", null)
    .in("status", ["created", "requires_action", "processing"])
    .order("created_at", { ascending: false })
    .returns<PendingTxRow[]>();

  const itemIds = [
    ...new Set(
      [...(orders ?? []).map((order) => order.item_id), ...(pendingTransactions ?? []).map((tx) => tx.item_id)].filter(
        Boolean
      )
    ),
  ];
  const orderIds = [...new Set((orders ?? []).map((order) => order.id).filter(Boolean))];

  const [{ data: items }, { data: txs }] = await Promise.all([
    itemIds.length
      ? supabase
          .from("marketplace_items")
          .select("id, title, image_url")
          .in("id", itemIds)
          .returns<ItemRow[]>()
      : Promise.resolve({ data: [] as ItemRow[] }),
    orderIds.length
      ? supabase
          .from("payment_transactions")
          .select("id, order_id, provider, status")
          .in("order_id", orderIds)
          .returns<TxRow[]>()
      : Promise.resolve({ data: [] as TxRow[] }),
  ]);

  const itemById = new Map((items ?? []).map((item) => [item.id, item]));
  const txByOrderId = new Map(
    (txs ?? []).filter((tx) => tx.order_id).map((tx) => [tx.order_id as string, tx])
  );

  return (
    <main className="app-container max-w-4xl py-8 space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">My Orders</h1>
        <p className="text-sm text-slate-600">Track fulfillment and payment status for your purchases.</p>
      </header>

      {pendingTransactions && pendingTransactions.length > 0 ? (
        <section className="app-card rounded-xl p-4 space-y-3 border border-amber-200 bg-amber-50/60">
          <h2 className="text-base font-semibold">Pending payment actions</h2>
          <p className="text-sm text-slate-600">
            You have checkout sessions waiting for confirmation. Continue the session to complete your order.
          </p>
          {pendingTransactions.map((tx) => {
            const item = itemById.get(tx.item_id);
            return (
              <article key={tx.id} className="rounded-lg border border-amber-200 bg-white p-3 space-y-1">
                <p className="font-medium">{item?.title ?? "Unknown item"}</p>
                <p className="text-sm text-slate-600">
                  Rs {Number(tx.amount).toLocaleString()} {tx.currency} · Payment: {tx.status} ({tx.provider})
                </p>
                {tx.reservation_expires_at ? (
                  <p className="text-xs text-slate-500">
                    Session expires: {new Date(tx.reservation_expires_at).toLocaleString()}
                  </p>
                ) : null}
                {tx.error_message ? <p className="text-xs text-rose-700">{tx.error_message}</p> : null}
                {tx.checkout_url ? (
                  <a
                    href={tx.checkout_url}
                    className="inline-flex mt-1 px-3 py-1.5 rounded-full border border-slate-300 text-sm hover:bg-slate-50"
                  >
                    Continue checkout
                  </a>
                ) : (
                  <p className="text-xs text-slate-500">
                    No checkout link is required right now. Payment will update when the provider confirms it.
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ) : null}

      {orders?.length === 0 ? (
        <div className="app-card rounded-xl p-6 text-slate-500">No orders yet.</div>
      ) : null}

      {orders?.map((order) => {
        const item = itemById.get(order.item_id);
        const tx = txByOrderId.get(order.id);
        return (
          <div key={order.id} className="app-card rounded-xl p-4 space-y-1">
            <p className="font-medium">{item?.title ?? "Unknown item"}</p>
            <p className="text-sm text-slate-600">
              Rs {Number(order.price).toLocaleString()} · Fulfillment: {order.status}
            </p>
            <p className="text-xs text-slate-500">
              Payment: {tx?.status ?? "legacy_paid"} {tx?.provider ? `(${tx.provider})` : ""}
            </p>
            <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        );
      })}
    </main>
  );
}
