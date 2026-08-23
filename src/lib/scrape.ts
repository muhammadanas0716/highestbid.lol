import "server-only";
import dns from "node:dns/promises";
import * as cheerio from "cheerio";
import { isPrivateAddress, type NormalizedUrl } from "./url";
import type { ScrapedMeta } from "./types";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 512 * 1024;
const UA = "Mozilla/5.0 (compatible; highestbid.lol/1.0; +https://highestbid.lol)";

/**
 * The hostname already passed the static checks in normalizeUrl — this makes sure
 * it doesn't *resolve* to something private either (SSRF).
 */
export async function resolvesPublicly(hostname: string): Promise<boolean> {
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    return addresses.length > 0 && !addresses.some((a) => isPrivateAddress(a.address));
  } catch {
    return false;
  }
}

export function faviconFor(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export async function scrapeUrl({ url, domain, urlKey }: NormalizedUrl): Promise<ScrapedMeta> {
  const fallback: ScrapedMeta = {
    url,
    urlKey,
    domain,
    title: domain,
    description: null,
    faviconUrl: faviconFor(domain),
  };

  try {
    const res = await fetch(url, {
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok || !res.headers.get("content-type")?.includes("text/html")) return fallback;

    const $ = cheerio.load(await readCapped(res, MAX_BYTES));

    const pick = (...selectors: string[]) => {
      for (const sel of selectors) {
        const el = $(sel).first();
        const value = (el.attr("content") ?? el.text() ?? "").trim();
        if (value) return value;
      }
      return "";
    };

    const title =
      pick('meta[property="og:title"]', 'meta[name="twitter:title"]', "title") || domain;
    const description =
      pick(
        'meta[property="og:description"]',
        'meta[name="twitter:description"]',
        'meta[name="description"]',
      ) || null;

    const iconHref = $(
      'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
    )
      .first()
      .attr("href");

    let faviconUrl = faviconFor(domain);
    if (iconHref) {
      try {
        faviconUrl = new URL(iconHref, res.url || url).toString();
      } catch {
        /* keep the fallback */
      }
    }

    return {
      url,
      urlKey,
      domain,
      title: title.slice(0, 120),
      description: description ? description.slice(0, 280) : null,
      faviconUrl,
    };
  } catch {
    return fallback;
  }
}

/** Stop reading once we've seen enough — a <head> never needs 50MB. */
async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  void reader.cancel();

  const buf = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    const take = Math.min(chunk.length, total - offset);
    buf.set(chunk.subarray(0, take), offset);
    offset += take;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}
