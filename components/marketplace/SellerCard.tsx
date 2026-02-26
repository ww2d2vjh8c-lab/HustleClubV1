import type { MarketplaceSeller } from "./types";
import Image from "next/image";

export default function SellerCard({
  seller,
}: {
  seller: MarketplaceSeller;
}) {
  return (
    <div className="border rounded-xl p-4 flex gap-4 items-start">
      <div className="relative w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
        {seller.avatar_url && (
          <Image
            src={seller.avatar_url}
            alt={seller.full_name || seller.username || "Seller avatar"}
            fill
            sizes="48px"
            className="object-cover"
          />
        )}
      </div>

      <div>
        <p className="font-medium">
          {seller.full_name || seller.username}
        </p>

        {seller.bio && (
          <p className="text-sm text-gray-600 mt-1">
            {seller.bio}
          </p>
        )}
      </div>
    </div>
  );
}
