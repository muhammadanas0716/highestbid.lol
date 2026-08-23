export type BoardRow = {
  id: string;
  slug: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  bidValue: number;
  clicks: number;
  createdAt: number;
  rank: number;
};

export type ListingStub = {
  slug: string;
  domain: string;
  faviconUrl: string | null;
};

export type RecentBid = {
  id: string;
  amount: number;
  createdAt: number;
  listing: ListingStub | null;
};

export type ClickEvent = {
  id: string;
  createdAt: number;
  listing: ListingStub | null;
};

export type SiteStats = {
  revenue: number;
  liveListings: number;
  totalListings: number;
  totalClicks: number;
};

export type Sponsor = {
  position: "left" | "right";
  listing:
    | (ListingStub & { title: string; description: string | null })
    | null;
};

export type ScrapedMeta = {
  url: string;
  urlKey: string;
  domain: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
};
