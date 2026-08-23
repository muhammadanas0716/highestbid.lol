import { ConvexHttpClient } from "convex/browser";

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export const isConvexConfigured = Boolean(deploymentUrl);

export function convexClient(): ConvexHttpClient {
  if (!deploymentUrl) {
    throw new Error("Missing NEXT_PUBLIC_CONVEX_URL — run `npx convex dev`, see .env.example");
  }
  return new ConvexHttpClient(deploymentUrl);
}

/**
 * Convex mutations are reachable by anyone holding the deployment URL, so the
 * write functions take a shared secret. This must match INTERNAL_API_SECRET set
 * on the Convex deployment itself (`npx convex env set INTERNAL_API_SECRET ...`).
 */
export function internalSecret(): string {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    throw new Error("Missing INTERNAL_API_SECRET — see .env.example");
  }
  return secret;
}

export const isWriteConfigured = Boolean(deploymentUrl && process.env.INTERNAL_API_SECRET);
