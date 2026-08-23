import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convexClient, internalSecret, isWriteConfigured } from "@/lib/convex";

export const runtime = "nodejs";

function home() {
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  );
}

/** Outbound click tracker: count it, then bounce them to the listing. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isWriteConfigured) return home();

  try {
    // One round trip: increments the counter and hands back the destination.
    const url = await convexClient().mutation(api.listings.registerClick, {
      secret: internalSecret(),
      slug,
    });
    return url ? NextResponse.redirect(url, { status: 302 }) : home();
  } catch (err) {
    console.error("[go] registerClick failed", err);
    return home();
  }
}
