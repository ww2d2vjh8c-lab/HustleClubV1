import { requireUser } from "@/lib/auth/requireUser";
import PostItemForm from "@/components/marketplace/PostItemForm";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  await requireUser("/marketplace/sell");

  return (
    <main className="max-w-xl mx-auto px-6 py-12 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Sell an item</h1>
        <p className="text-sm text-gray-600 mt-1">
          Post a thrift item to the marketplace.
        </p>
      </header>

      <PostItemForm />
    </main>
  );
}

