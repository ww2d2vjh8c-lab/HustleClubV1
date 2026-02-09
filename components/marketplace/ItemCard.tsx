import Link from "next/link";

export default function ItemCard({ item }: { item: any }) {
  // 🔑 Normalize seller (array → object)
  const seller = Array.isArray(item.seller)
    ? item.seller[0]
    : item.seller;

  return (
    <Link
      href={`/marketplace/${item.id}`}
      className="border rounded-xl overflow-hidden hover:shadow transition bg-white"
    >
      <div className="aspect-square bg-gray-100">
        {item.image_url && (
          <img
            src={item.image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="p-3 space-y-1">
        <p className="font-medium line-clamp-1">
          {item.title}
        </p>

        <p className="text-sm text-gray-600">
          ₹{item.price}
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
