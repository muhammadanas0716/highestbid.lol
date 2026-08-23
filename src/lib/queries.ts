import { api } from "@convex/_generated/api";
import { convexClient, isConvexConfigured } from "./convex";
import type { BoardRow, ClickEvent, RecentBid, SiteStats, Sponsor } from "./types";

const EMPTY_STATS: SiteStats = {
  revenue: 0,
  liveListings: 0,
  totalListings: 0,
  totalClicks: 0,
};

const EMPTY_SPONSORS: Sponsor[] = [
  { position: "left", listing: null },
  { position: "right", listing: null },
];

/** Convex is either configured or it isn't — never let a read take the page down. */
async function safely<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  if (!isConvexConfigured) return fallback;
  try {
    return await run();
  } catch (err) {
    console.error(`[${label}]`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

export function getBoard(limit = 100): Promise<BoardRow[]> {
  return safely("getBoard", () => convexClient().query(api.board.list, { limit }), []);
}

export function getRecentBids(limit = 12): Promise<RecentBid[]> {
  return safely("getRecentBids", () => convexClient().query(api.board.recentBids, { limit }), []);
}

export function getLiveTraffic(limit = 12): Promise<ClickEvent[]> {
  return safely("getLiveTraffic", () => convexClient().query(api.board.liveTraffic, { limit }), []);
}

export function getStats(): Promise<SiteStats> {
  return safely("getStats", () => convexClient().query(api.board.stats, {}), EMPTY_STATS);
}

export function getSponsors(): Promise<Sponsor[]> {
  return safely("getSponsors", () => convexClient().query(api.board.sponsors, {}), EMPTY_SPONSORS);
}

export function getListingBySlug(slug: string): Promise<BoardRow | null> {
  return safely("getListingBySlug", () => convexClient().query(api.board.bySlug, { slug }), null);
}

/**
 * Everyone else's live bids plus whatever this URL already banked, so the bid
 * screen can preview rank client-side without a round trip per keystroke.
 */
export function getRivalBids(
  urlKey: string,
): Promise<{ rivals: number[]; existingBid: number }> {
  return safely(
    "getRivalBids",
    () => convexClient().query(api.board.rivalBids, { urlKey }),
    { rivals: [], existingBid: 0 },
  );
}
