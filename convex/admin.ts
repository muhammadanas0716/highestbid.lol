import { v } from "convex/values";
import { mutation } from "./_generated/server";

function assertTrusted(secret: string) {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) throw new Error("INTERNAL_API_SECRET is not set on the Convex deployment.");
  if (secret.length !== expected.length) throw new Error("Unauthorized.");
  let diff = 0;
  for (let i = 0; i < secret.length; i++) diff |= secret.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) throw new Error("Unauthorized.");
}

/**
 * Takedown. The rules promise removal for malware, phishing and illegal content —
 * this is how that happens. Deletes the listing and everything hanging off it.
 *
 * Run it with:
 *   npx convex run admin:removeListing '{"secret":"...","slug":"..."}'
 */
export const removeListing = mutation({
  args: { secret: v.string(), slug: v.string() },
  handler: async (ctx, { secret, slug }) => {
    assertTrusted(secret);

    const listing = await ctx.db
      .query("listings")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!listing) return { removed: false, reason: "not found" as const };

    const bids = await ctx.db
      .query("bids")
      .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
      .collect();
    const clicks = await ctx.db
      .query("clickEvents")
      .withIndex("by_listing", (q) => q.eq("listingId", listing._id))
      .collect();
    const slots = await ctx.db.query("sponsorSlots").collect();

    for (const bid of bids) await ctx.db.delete(bid._id);
    for (const click of clicks) await ctx.db.delete(click._id);
    // Don't leave a sponsor slot pointing at a deleted row.
    for (const slot of slots) {
      if (slot.listingId === listing._id) await ctx.db.patch(slot._id, { listingId: null });
    }
    await ctx.db.delete(listing._id);

    return { removed: true, bids: bids.length, clicks: clicks.length };
  },
});

/** Pull a listing off the board without deleting its history. */
export const hideListing = mutation({
  args: { secret: v.string(), slug: v.string(), hidden: v.boolean() },
  handler: async (ctx, { secret, slug, hidden }) => {
    assertTrusted(secret);

    const listing = await ctx.db
      .query("listings")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!listing) return { updated: false };

    await ctx.db.patch(listing._id, { status: hidden ? "hidden" : "live" });
    return { updated: true, status: hidden ? "hidden" : "live" };
  },
});
