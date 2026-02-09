export default function SellerCard({ seller }: { seller: any }) {
  return (
    <div className="border rounded-xl p-4 flex gap-4 items-start">
      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
        {seller.avatar_url && (
          <img
            src={seller.avatar_url}
            alt=""
            className="w-full h-full object-cover"
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
