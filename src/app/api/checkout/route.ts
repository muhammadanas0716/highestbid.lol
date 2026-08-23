import { NextResponse } from "next/server";
import { clampBid, dollarsToCents, isPolarConfigured, polarClient, MAX_BID, MIN_BID } from "@/lib/polar";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { makeSlug, normalizeUrl } from "@/lib/url";

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

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Database isn't configured yet. Add your Supabase keys to .env.local." },
      { status: 503 },
    );
  }

  const db = supabaseAdmin();

  // One listing per product. If it's already on the board we top up the same row.
  const { data: existing } = await db
    .from("listings")
    .select("id, slug")
    .eq("url_key", normalized.urlKey)
    .maybeSingle();

  let listingId = existing?.id as string | undefined;
  let slug = existing?.slug as string | undefined;

  if (!listingId) {
    const { data: created, error } = await db
      .from("listings")
      .insert({
        slug: makeSlug(normalized.domain),
        url: normalized.url,
        url_key: normalized.urlKey,
        domain: normalized.domain,
        title: (body.title || normalized.domain).slice(0, 120),
        description: body.description ? body.description.slice(0, 280) : null,
        favicon_url: body.faviconUrl ?? null,
        status: "pending",
      })
      .select("id, slug")
      .single();

    if (error || !created) {
      console.error("[checkout] insert failed", error?.message);
      return NextResponse.json({ error: "Couldn't create that listing." }, { status: 500 });
    }
    listingId = created.id;
    slug = created.slug;
  }

  if (!listingId || !slug) {
    return NextResponse.json({ error: "Couldn't resolve that listing." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin;

  // Local preview escape hatch: with no Polar keys there is no payment to bypass,
  // so let a dev bid land directly instead of dead-ending the flow.
  if (!isPolarConfigured) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Payments aren't configured yet." },
        { status: 503 },
      );
    }
    await db.rpc("apply_bid", {
      p_listing_id: listingId,
      p_amount: amount,
      p_checkout_id: `dev_${Date.now()}_${listingId}`,
    });
    return NextResponse.json({ url: `${siteUrl}/success?dev=1&slug=${slug}` });
  }

  try {
    const checkout = await polarClient().checkouts.create({
      products: [process.env.POLAR_PRODUCT_ID as string],
      amount: dollarsToCents(amount),
      successUrl: `${siteUrl}/success?checkout_id={CHECKOUT_ID}`,
      metadata: {
        listing_id: listingId,
        slug: slug ?? "",
        bid_amount: amount,
      },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("[checkout] polar failed", err);
    return NextResponse.json({ error: "Couldn't start checkout." }, { status: 502 });
  }
}
