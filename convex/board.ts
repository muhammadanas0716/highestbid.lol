import { v } from "convex/values";
import { query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

const BOARD_CAP = 500;

/** Never leak manageToken — this is the only shape that reaches a browser. */
function publicRow(doc: Doc<"listings">) {
  return {
    id: doc._id,
    slug: doc.slug,
    url: doc.url,
    domain: doc.domain,
    title: doc.title,
    description: doc.description,
    faviconUrl: doc.faviconUrl,
    bidValue: doc.bidValue,
    clicks: doc.clicks,
    createdAt: doc._creationTime,
  };
}

function stub(doc: Doc<"listings"> | null) {
  if (!doc) return null;
  return { slug: doc.slug, domain: doc.domain, faviconUrl: doc.faviconUrl };
}

/**
 * Every live listing, ranked. Postgres did this with a window function; here we
 * sort in JS, which is fine while the board fits in one query (capped above).
 */
async function rankedListings(ctx: QueryCtx) {
  const live = await ctx.db
    .query("listings")
    .withIndex("by_status_and_bid", (q) => q.eq("status", "live"))
    .order("desc")
    .take(BOARD_CAP);

  // Index order breaks ties newest-first; the board wants whoever got there first.
  return live.sort(
    (a, b) => b.bidValue - a.bidValue || a._creationTime - b._creationTime,
  );
}

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 100 }) => {
    const ranked = await rankedListings(ctx);
    return ranked
      .slice(0, limit)
      .map((doc, i) => ({ ...publicRow(doc), rank: i + 1 }));
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const doc = await ctx.db
      .query("listings")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!doc) return null;

    const ranked = await rankedListings(ctx);
    const rank = ranked.findIndex((r) => r._id === doc._id) + 1;
    return { ...publicRow(doc), rank };
  },
});

export const recentBids = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const bids = await ctx.db.query("bids").order("desc").take(limit);
    return Promise.all(
      bids.map(async (bid) => ({
        id: bid._id,
        amount: bid.amount,
        createdAt: bid._creationTime,
        listing: stub(await ctx.db.get(bid.listingId)),
      })),
    );
  },
});

export const liveTraffic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 12 }) => {
    const events = await ctx.db.query("clickEvents").order("desc").take(limit);
    return Promise.all(
      events.map(async (event) => ({
        id: event._id,
        createdAt: event._creationTime,
        listing: stub(await ctx.db.get(event.listingId)),
      })),
    );
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("listings").take(BOARD_CAP);
    return {
      revenue: all.reduce((sum, r) => sum + r.totalPaid, 0),
      liveListings: all.filter((r) => r.status === "live").length,
      totalListings: all.length,
      totalClicks: all.reduce((sum, r) => sum + r.clicks, 0),
    };
  },
});

export const sponsors = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const slotFor = async (position: "left" | "right") => {
      const slot = await ctx.db
        .query("sponsorSlots")
        .withIndex("by_position_and_end", (q) =>
          q.eq("position", position).gt("endsAt", now),
        )
        .order("desc")
        .first();

      if (!slot?.listingId) return { position, listing: null };

      const doc = await ctx.db.get(slot.listingId as Id<"listings">);
      return {
        position,
        listing: doc
          ? {
              slug: doc.slug,
              domain: doc.domain,
              title: doc.title,
              description: doc.description,
              faviconUrl: doc.faviconUrl,
            }
          : null,
      };
    };

    return [await slotFor("left"), await slotFor("right")];
  },
});

/**
 * Everyone else's live bids plus whatever this URL already banked, so the bid
 * screen can preview rank without a round trip per keystroke.
 */
export const rivalBids = query({
  args: { urlKey: v.string() },
  handler: async (ctx, { urlKey }) => {
    const live = await ctx.db
      .query("listings")
      .withIndex("by_status_and_bid", (q) => q.eq("status", "live"))
      .take(BOARD_CAP);

    const own = await ctx.db
      .query("listings")
      .withIndex("by_url_key", (q) => q.eq("urlKey", urlKey))
      .unique();

    return {
      rivals: live.filter((r) => r.urlKey !== urlKey).map((r) => r.bidValue),
      existingBid: own?.bidValue ?? 0,
    };
  },
});
