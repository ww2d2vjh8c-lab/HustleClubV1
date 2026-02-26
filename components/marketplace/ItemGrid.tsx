import ItemCard from "./ItemCard";
import type { MarketplaceItem } from "./types";

export default function ItemGrid({
  items,
}: {
  items: MarketplaceItem[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-gray-500">
        No items available right now.
      </p>
    );
  }

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </section>
  );
}
