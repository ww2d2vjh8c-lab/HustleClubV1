export type MarketplaceSeller = {
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export type MarketplaceItem = {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  seller: MarketplaceSeller | MarketplaceSeller[] | null;
};
