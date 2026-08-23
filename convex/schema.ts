import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex adds `_id` and `_creationTime` to every document, so there's no
 * explicit id or createdAt column here.
 *
 * Two things Postgres gave us for free that are now enforced in code:
 *   - uniqueness on `slug`, `urlKey` and `checkoutId` (see convex/listings.ts)
 *   - row-level security — public queries simply never return `manageToken`
 */
export default defineSchema({
  listings: defineTable({
    slug: v.string(),
    url: v.string(),
    urlKey: v.string(), // normalized url; one listing per product
    domain: v.string(),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    faviconUrl: v.union(v.string(), v.null()),

    bidValue: v.number(), // what rank is based on
    totalPaid: v.number(), // lifetime spend, never goes down
    decayAnchor: v.number(), // reserved: "the melt" lands here

    clicks: v.number(),
    status: v.union(v.literal("pending"), v.literal("live"), v.literal("hidden")),

    manageToken: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_url_key", ["urlKey"])
    .index("by_status_and_bid", ["status", "bidValue"]),

  bids: defineTable({
    listingId: v.id("listings"),
    amount: v.number(),
    checkoutId: v.string(), // polar checkout id; webhook idempotency
  })
    .index("by_checkout", ["checkoutId"])
    .index("by_listing", ["listingId"]),

  clickEvents: defineTable({
    listingId: v.id("listings"),
  }).index("by_listing", ["listingId"]),

  sponsorSlots: defineTable({
    position: v.union(v.literal("left"), v.literal("right")),
    listingId: v.union(v.id("listings"), v.null()),
    startsAt: v.number(),
    endsAt: v.number(),
  }).index("by_position_and_end", ["position", "endsAt"]),
});
