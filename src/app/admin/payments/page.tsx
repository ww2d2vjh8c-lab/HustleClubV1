import { requireAdmin } from "@/lib/supabase/auth";
import { simulatePaymentFailure, simulatePaymentSuccess } from "./actions";

export const dynamic = "force-dynamic";

type TxRow = {
  id: string;
  provider: string;
  provider_reference: string | null;
  status: string;
  buyer_id: string;
  seller_id: string;
  item_id: string;
  order_id: string | null;
  amount: number | string;
  currency: string;
  created_at: string;
  paid_at: string | null;
  error_message: string | null;
};

export default async function AdminPaymentsPage() {
  const { supabase } = await requireAdmin();

  const { data: transactions, error } = await supabase
    .from("payment_transactions")
    .select(
      "id, provider, provider_reference, status, buyer_id, seller_id, item_id, order_id, amount, currency, created_at, paid_at, error_message"
    )
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<TxRow[]>();

  if (error) {
    return (
      <main className="app-card rounded-xl p-6">
        <p className="text-red-600">Failed to load payment transactions.</p>
      </main>
    );
  }

  const buyerSellerIds = [
    ...new Set(
      (transactions ?? []).flatMap((tx) => [tx.buyer_id, tx.seller_id]).filter(Boolean)
    ),
  ] as string[];
  const itemIds = [...new Set((transactions ?? []).map((tx) => tx.item_id).filter(Boolean))];

  const [{ data: profiles }, { data: items }] = await Promise.all([
    buyerSellerIds.length
      ? supabase
          .from("profiles")
          .select("id, username, full_name, email")
          .in("id", buyerSellerIds)
      : Promise.resolve({
          data: [] as { id: string; username: string | null; full_name: string | null; email: string | null }[],
        }),
    itemIds.length
      ? supabase
          .from("marketplace_items")
          .select("id, title")
          .in("id", itemIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const itemById = new Map((items ?? []).map((item) => [item.id, item]));

  const statusCount = (status: string) =>
    (transactions ?? []).filter((tx) => tx.status === status).length;

  return (
    <main className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">Payments Console</h1>
        <p className="text-sm text-slate-600">
          Provider-agnostic payment transaction log. Ready for Stripe/Razorpay webhook mapping.
        </p>
      </header>

      <section className="app-card rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <Metric label="Total" value={transactions?.length ?? 0} />
        <Metric label="Created" value={statusCount("created")} />
        <Metric label="Requires Action" value={statusCount("requires_action")} />
        <Metric label="Succeeded" value={statusCount("succeeded")} />
        <Metric label="Failed" value={statusCount("failed")} />
      </section>

      <section className="space-y-3">
        {transactions?.map((tx) => (
          <article key={tx.id} className="app-card rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-semibold">
                  {itemById.get(tx.item_id)?.title ?? "Unknown item"} · Rs{" "}
                  {Number(tx.amount).toLocaleString()} {tx.currency}
                </h2>
                <p className="text-sm text-slate-600">
                  Buyer: {formatProfile(profileById.get(tx.buyer_id))} · Seller:{" "}
                  {formatProfile(profileById.get(tx.seller_id))}
                </p>
                <p className="text-sm text-slate-600">
                  Provider: {tx.provider}
                  {tx.provider_reference ? ` · Ref: ${tx.provider_reference}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  Status: {tx.status}
                  {tx.order_id ? ` · Order: ${tx.order_id.slice(0, 8)}` : ""}
                  {tx.paid_at ? ` · Paid: ${new Date(tx.paid_at).toLocaleString()}` : ""}
                </p>
                <p className="text-xs text-slate-500">Created: {new Date(tx.created_at).toLocaleString()}</p>
                {tx.error_message ? (
                  <p className="text-xs text-rose-700">Error: {tx.error_message}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {tx.status !== "succeeded" && !tx.order_id ? (
                  <form
                    action={async () => {
                      "use server";
                      await simulatePaymentSuccess(tx.id);
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 text-sm hover:bg-emerald-50">
                      Mark Succeeded
                    </button>
                  </form>
                ) : null}

                {tx.status !== "failed" ? (
                  <form
                    action={async () => {
                      "use server";
                      await simulatePaymentFailure(tx.id);
                    }}
                  >
                    <button className="px-3 py-1.5 rounded-full border border-rose-200 text-rose-700 text-sm hover:bg-rose-50">
                      Mark Failed
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          </article>
        ))}

        {transactions?.length === 0 ? (
          <div className="app-card rounded-xl p-6 text-slate-500">
            No payment transactions found.
          </div>
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

function formatProfile(
  profile: { username: string | null; full_name: string | null; email: string | null } | undefined
) {
  if (!profile) return "Unknown";
  return profile.full_name || profile.username || profile.email || "Unknown";
}
