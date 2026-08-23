import { Polar } from "@polar-sh/sdk";

export const MIN_BID = 1;
export const MAX_BID = 10_000;

export function polarClient() {
  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing POLAR_ACCESS_TOKEN — see .env.example");
  }
  return new Polar({
    accessToken,
    // Polar runs a separate sandbox environment; point at it until you go live.
    server: process.env.POLAR_SERVER === "production" ? "production" : "sandbox",
  });
}

export const isPolarConfigured = Boolean(
  process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_PRODUCT_ID,
);

/** Bids are whole dollars on the board; Polar wants cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

export function clampBid(value: unknown): number | null {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < MIN_BID || n > MAX_BID) return null;
  return n;
}
