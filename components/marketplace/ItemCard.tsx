import Link from "next/link";
import type { MarketplaceItem, MarketplaceSeller } from "./types";
import Image from "next/image";

export default function ItemCard({ item }: { item: MarketplaceItem }) {
  // 🔑 Normalize seller (array → object)
  const seller: MarketplaceSeller | null = Array.isArray(item.seller)
    ? item.seller[0]
    : item.seller;

  return (
    <Link
      href={`/marketplace/${item.id}`}
      className="border rounded-xl overflow-hidden hover:shadow transition bg-white"
    >
      <div className="aspect-square bg-gray-100">
        {item.image_url && (
          <Image
            src={item.image_url}
            alt={item.title}
            width={400}
            height={400}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-3 space-y-1">
        <p className="font-medium line-clamp-1">
          {item.title}
        </p>

        <p className="text-sm text-gray-600">
          ₹{item.price ?? 0}
        </p>

        {seller && (
          <p className="text-xs text-gray-500">
            {seller.full_name || seller.username}
          </p>
        )}
      </div>
    </Link>
  );
}
