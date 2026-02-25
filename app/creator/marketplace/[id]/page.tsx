import { requireCreator } from "@/lib/supabase/requireCreator";
import { redirect, notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/* ================= SERVER ACTIONS ================= */

async function publishItem(formData: FormData) {
  "use server";

  const { supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("marketplace_items")
    .update({ is_published: true })
    .eq("id", id);

  redirect(`/creator/marketplace/${id}`);
}

async function unpublishItem(formData: FormData) {
  "use server";

  const { supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("marketplace_items")
    .update({ is_published: false })
    .eq("id", id);

  redirect(`/creator/marketplace/${id}`);
}

async function markSold(formData: FormData) {
  "use server";

  const { supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("marketplace_items")
    .update({ is_sold: true })
    .eq("id", id);

  redirect(`/creator/marketplace/${id}`);
}

async function deleteItem(formData: FormData) {
  "use server";

  const { supabase } = await requireCreator();
  const id = Number(formData.get("id"));

  await supabase
    .from("marketplace_items")
    .delete()
    .eq("id", id);

  redirect("/creator/marketplace");
}

/* ================= PAGE ================= */

export default async function ManageMarketplaceItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, supabase } = await requireCreator();

  const { data: item, error } = await supabase
    .from("marketplace_items")
    .select("*")
    .eq("id", Number(id))
    .eq("seller_id", user.id)
    .single();

  if (error || !item) {
    notFound();
  }

  let status = "Draft";
  let statusColor = "text-gray-500";

  if (item.is_sold) {
    status = "Sold";
    statusColor = "text-red-600";
  } else if (item.is_published) {
    status = "Published";
    statusColor = "text-green-600";
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">
          Manage Item
        </h1>
        <p className="text-sm text-gray-600">
          {item.title}
        </p>
      </header>

      <div className="border rounded-xl p-6 bg-white space-y-4">
        <p className="text-lg font-semibold">
          ₹{item.price ?? 0}
        </p>

        <p className="text-sm text-gray-600">
          {item.description}
        </p>

        <p className={`text-sm font-medium ${statusColor}`}>
          Status: {status}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3">

        {!item.is_published && !item.is_sold && (
          <form action={publishItem}>
            <input type="hidden" name="id" value={item.id} />
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm">
              Publish
            </button>
          </form>
        )}

        {item.is_published && !item.is_sold && (
          <form action={unpublishItem}>
            <input type="hidden" name="id" value={item.id} />
            <button className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm">
              Unpublish
            </button>
          </form>
        )}

        {!item.is_sold && (
          <form action={markSold}>
            <input type="hidden" name="id" value={item.id} />
            <button className="px-4 py-2 bg-black text-white rounded-md text-sm">
              Mark as Sold
            </button>
          </form>
        )}

        <form action={deleteItem}>
          <input type="hidden" name="id" value={item.id} />
          <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm">
            Delete
          </button>
        </form>

      </div>
    </main>
  );
}