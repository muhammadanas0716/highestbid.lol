import { NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/url";
import { resolvesPublicly, scrapeUrl } from "@/lib/scrape";
import { getRivalBids } from "@/lib/queries";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }

  const normalized = normalizeUrl(body.url ?? "");
  if (!normalized) {
    return NextResponse.json({ error: "That doesn't look like a real URL." }, { status: 400 });
  }

  if (!(await resolvesPublicly(new URL(normalized.url).hostname))) {
    return NextResponse.json({ error: "Couldn't reach that domain." }, { status: 400 });
  }

  const [meta, { existingBid }] = await Promise.all([
    scrapeUrl(normalized),
    getRivalBids(normalized.urlKey),
  ]);

  return NextResponse.json({ meta, existingBid });
}
