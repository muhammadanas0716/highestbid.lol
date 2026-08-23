import { NextResponse } from "next/server";
import { normalizeUrl } from "@/lib/url";
import { resolvesPublicly, scrapeUrl } from "@/lib/scrape";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

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

  const meta = await scrapeUrl(normalized);
  const existing = await findExisting(normalized.urlKey);

  return NextResponse.json({ meta, existing });
}

async function findExisting(urlKey: string) {
  if (!isSupabaseConfigured) return null;

  const { data } = await supabaseAdmin()
    .from("listings")
    .select("slug, bid_value, status")
    .eq("url_key", urlKey)
    .maybeSingle();

  return data ?? null;
}
