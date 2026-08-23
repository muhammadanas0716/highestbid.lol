import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { supabaseAdmin } from "@/lib/supabase";
import { centsToDollars, clampBid } from "@/lib/polar";

export const runtime = "nodejs";

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

  // checkoutId keys idempotency — Polar retries, and a retry must not bid twice.
  const idempotencyKey = order.checkoutId ?? `order_${order.id}`;

  const { error } = await supabaseAdmin().rpc("apply_bid", {
    p_listing_id: listingId,
    p_amount: amount,
    p_checkout_id: idempotencyKey,
  });

  if (error) {
    // Non-2xx makes Polar retry, which is what we want on a transient DB failure.
    console.error("[webhook] apply_bid failed", error.message);
    return NextResponse.json({ error: "Could not apply bid." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
