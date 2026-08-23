import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  clampBid,
  dollarsToCents,
  isPolarConfigured,
  polarClient,
  MAX_BID,
  MIN_BID,
} from "@/lib/polar";
import { convexClient, internalSecret, isWriteConfigured } from "@/lib/convex";
import { normalizeUrl } from "@/lib/url";

export const runtime = "nodejs";

type Body = {
  url?: string;
  amount?: number;
  title?: string;
  description?: string | null;
  faviconUrl?: string | null;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const amount = clampBid(body.amount);
  if (amount === null) {
    return NextResponse.json(
      { error: `Bids run from $${MIN_BID} to $${MAX_BID.toLocaleString()}.` },
      { status: 400 },
    );
  }

  const normalized = normalizeUrl(body.url ?? "");
  if (!normalized) {
    return NextResponse.json({ error: "That doesn't look like a real URL." }, { status: 400 });
  }

  if (!isWriteConfigured) {
    return NextResponse.json(
      { error: "Database isn't configured yet. Add your Convex keys to .env.local." },
      { status: 503 },
    );
  }

  const convex = convexClient();
  const secret = internalSecret();

  // One listing per product. If it's already on the board we top up the same row.
  let listing: { id: Id<"listings">; slug: string };
  try {
    listing = await convex.mutation(api.listings.ensure, {
      secret,
      url: normalized.url,
      urlKey: normalized.urlKey,
      domain: normalized.domain,
      title: (body.title || normalized.domain).slice(0, 120),
      description: body.description ? body.description.slice(0, 280) : null,
      faviconUrl: body.faviconUrl ?? null,
    });
  } catch (err) {
    console.error("[checkout] convex ensure failed", err);
    return NextResponse.json({ error: "Couldn't create that listing." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  // Local preview escape hatch: with no Polar keys there is no payment to bypass,
  // so let a dev bid land directly instead of dead-ending the flow.
  if (!isPolarConfigured) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
    }
    await convex.mutation(api.listings.applyBid, {
      secret,
      listingId: listing.id,
      amount,
      checkoutId: `dev_${Date.now()}_${listing.id}`,
    });
    return NextResponse.json({ url: `${siteUrl}/success?dev=1&slug=${listing.slug}` });
  }

  try {
    const checkout = await polarClient().checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID as string],
      amount: dollarsToCents(amount),
      successUrl: `${siteUrl}/success?checkout_id={CHECKOUT_ID}`,
      metadata: {
        listing_id: listing.id,
        slug: listing.slug,
        bid_amount: amount,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[checkout] polar failed", err);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 502 });
  }
}
