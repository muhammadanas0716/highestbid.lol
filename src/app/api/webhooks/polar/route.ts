import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { convexClient, internalSecret, isWriteConfigured } from "@/lib/convex";
import { centsToDollars, clampBid } from "@/lib/polar";

export const runtime = "nodejs";

/**
 * Signature verification needs Node crypto and the raw body, which is why this
 * lives here rather than in a Convex httpAction — Convex's default runtime is a
 * V8 isolate. Verified events are handed straight to a Convex mutation.
 */
export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook] POLAR_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  const raw = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event;
  try {
    event = validateEvent(raw, headers, secret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
    }
    console.error("[webhook] validation threw", err);
    return NextResponse.json({ error: "Bad payload." }, { status: 400 });
  }

  // order.paid is the only event that means money actually landed.
  if (event.type !== "order.paid") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  const order = event.data;
  const metadata = (order.metadata ?? {}) as Record<string, unknown>;
  const listingId = typeof metadata.listing_id === "string" ? metadata.listing_id : null;

  if (!listingId) {
    console.error("[webhook] order.paid with no listing_id", order.id);
    return NextResponse.json({ ok: true, skipped: "no listing_id" });
  }

  // The bid is what we quoted on the board, not the taxed total.
  const amount =
    clampBid(metadata.bid_amount) ?? clampBid(centsToDollars(order.subtotalAmount ?? 0));

  if (amount === null) {
    console.error("[webhook] order.paid with unusable amount", order.id, metadata.bid_amount);
    return NextResponse.json({ ok: true, skipped: "bad amount" });
  }

  if (!isWriteConfigured) {
    console.error("[webhook] convex is not configured");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }

  // checkoutId keys idempotency — Polar retries, and a retry must not bid twice.
  try {
    const result = await convexClient().mutation(api.listings.applyBid, {
      secret: internalSecret(),
      // Polar metadata is untyped strings; applyBid re-checks the row exists.
      listingId: listingId as Id<"listings">,
      amount,
      checkoutId: order.checkoutId ?? `order_${order.id}`,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Non-2xx makes Polar retry, which is what we want on a transient failure.
    console.error("[webhook] applyBid failed", err);
    return NextResponse.json({ error: "Could not apply bid." }, { status: 500 });
  }
}
