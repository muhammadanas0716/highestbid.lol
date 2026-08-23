const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
  "169.254.169.254",
]);

/** Private / link-local / loopback ranges — we fetch user-supplied URLs, so this matters. */
export function isPrivateAddress(host: string): boolean {
  if (BLOCKED_HOSTNAMES.has(host.toLowerCase())) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }

  // IPv6 loopback / unique-local / link-local
  const lower = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) {
    return true;
  }
  return false;
}

export type NormalizedUrl = { url: string; urlKey: string; domain: string };

/**
 * Accepts what a human would actually paste ("acme.com", "https://acme.com/x?ref=1")
 * and produces a canonical URL plus a dedupe key, so the same product can't take
 * two slots on the board.
 */
export function normalizeUrl(input: string): NormalizedUrl | null {
  const raw = input.trim();
  if (!raw) return null;

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname.includes(".")) return null;
  if (isPrivateAddress(parsed.hostname)) return null;

  const domain = parsed.hostname.replace(/^www\./i, "").toLowerCase();
  const path = parsed.pathname.replace(/\/+$/, "");
  const urlKey = `${domain}${path}`.toLowerCase();

  parsed.hash = "";
  parsed.protocol = "https:";

  return { url: parsed.toString(), urlKey, domain };
}

const SLUG_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function makeSlug(domain: string): string {
  const base = domain
    .replace(/\.[a-z]+$/i, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 28);

  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += SLUG_ALPHABET[Math.floor(Math.random() * SLUG_ALPHABET.length)];
  }
  return `${base || "listing"}-${suffix}`;
}
