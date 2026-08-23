import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import type { BoardRow, ClickEvent, Listing, RecentBid, SiteStats, Sponsor } from "./types";

const LISTING_FIELDS = "slug, domain, favicon_url";

const EMPTY_STATS: SiteStats = {
  revenue: 0,
  live_listings: 0,
  total_listings: 0,
  total_clicks: 0,
};

export async function getBoard(limit = 100): Promise<BoardRow[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseAdmin()
    .from("board")
    .select("*")
    .order("rank", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("[getBoard]", error.message);
    return [];
  }
  return (data ?? []) as BoardRow[];
}

export async function getRecentBids(limit = 12): Promise<RecentBid[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseAdmin()
    .from("bids")
    .select(`id, amount, created_at, listing:listings(${LISTING_FIELDS})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentBids]", error.message);
    return [];
  }
  return normalizeJoin<RecentBid>(data);
}

export async function getLiveTraffic(limit = 12): Promise<ClickEvent[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabaseAdmin()
    .from("click_events")
    .select(`id, created_at, listing:listings(${LISTING_FIELDS})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getLiveTraffic]", error.message);
    return [];
  }
  return normalizeJoin<ClickEvent>(data);
}

export async function getStats(): Promise<SiteStats> {
  if (!isSupabaseConfigured) return EMPTY_STATS;

  const { data, error } = await supabaseAdmin().from("site_stats").select("*").single();
  if (error || !data) {
    console.error("[getStats]", error?.message);
    return EMPTY_STATS;
  }
  return data as SiteStats;
}

export async function getSponsors(): Promise<Sponsor[]> {
  const empty: Sponsor[] = [
    { position: "left", listing: null },
    { position: "right", listing: null },
  ];
  if (!isSupabaseConfigured) return empty;

  const { data, error } = await supabaseAdmin()
    .from("sponsor_slots")
    .select("position, ends_at, listing:listings(slug, domain, title, description, favicon_url)")
    .gt("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: false });

  if (error) {
    console.error("[getSponsors]", error.message);
    return empty;
  }

  const rows = normalizeJoin<Sponsor & { ends_at: string }>(data);
  return [
    rows.find((r) => r.position === "left") ?? empty[0],
    rows.find((r) => r.position === "right") ?? empty[1],
  ];
}

export async function getListingBySlug(slug: string): Promise<Listing | null> {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabaseAdmin()
    .from("listings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const { data: ranked } = await supabaseAdmin()
    .from("board")
    .select("rank")
    .eq("id", data.id)
    .maybeSingle();

  return { ...(data as Omit<Listing, "rank">), rank: (ranked?.rank as number) ?? 0 };
}

/**
 * Everyone else's live bids, plus whatever this URL has already banked — enough
 * for the bid screen to preview rank client-side without a round trip per keystroke.
 */
export async function getRivalBids(
  urlKey: string,
): Promise<{ rivals: number[]; existingBid: number }> {
  if (!isSupabaseConfigured) return { rivals: [], existingBid: 0 };

  const db = supabaseAdmin();

  const [{ data: rows, error }, { data: own }] = await Promise.all([
    db.from("listings").select("url_key, bid_value").eq("status", "live").limit(1000),
    db.from("listings").select("bid_value").eq("url_key", urlKey).maybeSingle(),
  ]);

  if (error) {
    console.error("[getRivalBids]", error.message);
    return { rivals: [], existingBid: 0 };
  }

  return {
    rivals: (rows ?? [])
      .filter((r) => r.url_key !== urlKey)
      .map((r) => Number(r.bid_value)),
    existingBid: Number(own?.bid_value ?? 0),
  };
}

/** PostgREST returns embedded one-to-one joins as an array; flatten it. */
function normalizeJoin<T>(rows: unknown[] | null): T[] {
  return (rows ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const listing = record.listing;
    return {
      ...record,
      listing: Array.isArray(listing) ? (listing[0] ?? null) : (listing ?? null),
    } as T;
  });
}
