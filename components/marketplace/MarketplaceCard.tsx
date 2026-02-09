import Link from "next/link";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  publishItem,
  unpublishItem,
  deleteItem,
} from "@/app/marketplace/actions";

type Props = {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  isPublished: boolean;
};

export default function MarketplaceCard({
  id,
  title,
  price,
  imageUrl,
  isPublished,
}: Props) {
  return (
    <div className="border rounded-xl overflow-hidden bg-white hover:shadow-sm transition">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="h-44 bg-gray-100" />
      )}

      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">{title}</h2>
          <StatusBadge active={isPublished} />
        </div>

        <p className="text-sm text-gray-600">₹{price}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            href={`/marketplace/edit/${id}`}
            className="px-3 py-1 text-sm border rounded"
          >
            Edit
          </Link>

          {isPublished ? (
            <form action={unpublishItem.bind(null, id)}>
              <button className="px-3 py-1 text-sm border rounded">
                Unpublish
              </button>
            </form>
          ) : (
            <form action={publishItem.bind(null, id)}>
              <button className="px-3 py-1 text-sm bg-black text-white rounded">
                Publish
              </button>
            </form>
          )}

          <form action={deleteItem.bind(null, id)}>
            <button className="px-3 py-1 text-sm text-red-600 border rounded">
              Delete
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
