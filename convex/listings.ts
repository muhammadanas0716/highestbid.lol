import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

/**
 * Convex functions are callable by anyone holding the deployment URL, and these
 * three all write. Only our Next.js server should reach them, so each one carries
 * a shared secret (set INTERNAL_API_SECRET in the Convex dashboard *and* in
 * .env.local — they have to match).
 */
function assertTrusted(secret: string) {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    throw new Error("INTERNAL_API_SECRET is not set on the Convex deployment.");
  }
  if (!constantTimeEqual(secret, expected)) {
    throw new Error("Unauthorized.");
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

async function uniqueSlug(ctx: MutationCtx, domain: string): Promise<string> {
  const base =
    domain
      .replace(/\.[a-z]+$/i, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()
      .slice(0, 28) || "listing";

  // No unique constraint in Convex, so collisions are checked by hand.
  for (let attempt = 0; attempt < 8; attempt++) {
    let suffix = "";
    for (let i = 0; i < 4; i++) {
      suffix += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
    }
    const candidate = `${base}-${suffix}`;
    const taken = await ctx.db
      .query("listings")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique();
    if (!taken) return candidate;
  }
  throw new Error("Could not allocate a slug.");
}

/** Find the listing for this URL, or create it pending its first payment. */
export const ensure = mutation({
  args: {
    secret: v.string(),
    url: v.string(),
    urlKey: v.string(),
    domain: v.string(),
    title: v.string(),
    description: v.union(v.string(), v.null()),
    faviconUrl: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    assertTrusted(args.secret);

    const existing = await ctx.db
      .query("listings")
      .withIndex("by_url_key", (q) => q.eq("urlKey", args.urlKey))
      .unique();

    if (existing) return { id: existing._id, slug: existing.slug };

    const slug = await uniqueSlug(ctx, args.domain);
    const id = await ctx.db.insert("listings", {
      slug,
      url: args.url,
      urlKey: args.urlKey,
      domain: args.domain,
      title: args.title.slice(0, 120),
      description: args.description ? args.description.slice(0, 280) : null,
      faviconUrl: args.faviconUrl,
      bidValue: 0,
      totalPaid: 0,
      decayAnchor: Date.now(),
      clicks: 0,
      status: "pending",
      manageToken: crypto.randomUUID(),
    });

    return { id, slug };
  },
});

/**
 * Bank a paid bid. Idempotent on checkoutId — Polar retries webhooks, and a
 * retry must not bid twice. Convex mutations are serializable, so the
 * read-then-insert below can't race another copy of the same webhook.
 */
export const applyBid = mutation({
  args: {
    secret: v.string(),
    listingId: v.id("listings"),
    amount: v.number(),
    checkoutId: v.string(),
  },
  handler: async (ctx, { secret, listingId, amount, checkoutId }) => {
    assertTrusted(secret);

    const seen = await ctx.db
      .query("bids")
      .withIndex("by_checkout", (q) => q.eq("checkoutId", checkoutId))
      .unique();

    if (seen) return { applied: false, reason: "duplicate" as const };

    const listing = await ctx.db.get(listingId);
    if (!listing) return { applied: false, reason: "missing" as const };

    await ctx.db.insert("bids", { listingId, amount, checkoutId });
    await ctx.db.patch(listingId, {
      bidValue: listing.bidValue + amount,
      totalPaid: listing.totalPaid + amount,
      decayAnchor: Date.now(),
      status: "live",
    });

    return { applied: true, reason: "ok" as const };
  },
});

/** Count an outbound click and hand back where to send them. */
export const registerClick = mutation({
  args: { secret: v.string(), slug: v.string() },
  handler: async (ctx, { secret, slug }) => {
    assertTrusted(secret);

    const listing = await ctx.db
      .query("listings")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!listing || listing.status !== "live") return null;

    await ctx.db.patch(listing._id, { clicks: listing.clicks + 1 });
    await ctx.db.insert("clickEvents", { listingId: listing._id });

    return listing.url;
  },
});
