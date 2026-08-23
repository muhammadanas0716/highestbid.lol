export type BoardRow = {
  id: string;
  slug: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  favicon_url: string | null;
  bid_value: number;
  clicks: number;
  created_at: string;
  rank: number;
};

export type Listing = BoardRow & {
  url_key: string;
  total_paid: number;
  status: "pending" | "live" | "hidden";
};

export type RecentBid = {
  id: string;
  amount: number;
  created_at: string;
  listing: Pick<BoardRow, "slug" | "domain" | "favicon_url"> | null;
};

export type ClickEvent = {
  id: number;
  created_at: string;
  listing: Pick<BoardRow, "slug" | "domain" | "favicon_url"> | null;
};

export type SiteStats = {
  revenue: number;
  live_listings: number;
  total_listings: number;
  total_clicks: number;
};

export type Sponsor = {
  position: "left" | "right";
  listing: Pick<BoardRow, "slug" | "domain" | "title" | "description" | "favicon_url"> | null;
};

export type ScrapedMeta = {
  url: string;
  urlKey: string;
  domain: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
};
