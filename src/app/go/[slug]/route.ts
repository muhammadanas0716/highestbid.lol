import { NextResponse } from "next/server";
import { api } from "@convex/_generated/api";
import { convexClient, internalSecret, isConvexConfigured } from "@/lib/convex";

export const runtime = "nodejs";

function home() {
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  );
}

/**
 * Outbound click tracker.
 *
 * Resolving the destination and counting the click are deliberately separate.
 * People pay for these clicks, so the redirect must survive the counter failing —
 * a missing INTERNAL_API_SECRET degrades to "clicks don't count", never to a
 * dead link.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!isConvexConfigured) {
    console.error("[go] NEXT_PUBLIC_CONVEX_URL is not set");
    return home();
  }

  const convex = convexClient();

  let url: string | null;
  try {
    url = await convex.query(api.board.resolveSlug, { slug });
  } catch (err) {
    console.error("[go] could not resolve slug", slug, err);
    return home();
  }

  if (!url) {
    console.warn("[go] no live listing for slug", slug);
    return home();
  }

  // Best effort. Never let this stand between someone and the site they clicked.
  try {
    await convex.mutation(api.listings.registerClick, {
      secret: internalSecret(),
      slug,
    });
  } catch (err) {
    console.error("[go] click not counted for", slug, err);
  }

  return NextResponse.redirect(url, { status: 302 });
}
