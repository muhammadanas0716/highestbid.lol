# highestbid.lol

A paid leaderboard. Paste a link, pay what you want, take a spot. Rank is total
spend, highest first — no algorithm, no upvotes, no editor.

Next.js 16 (App Router) · Convex · Polar · Tailwind v4.

---

## Setup

### 1. Convex

```bash
npx convex dev
```

First run logs you in, creates the deployment, writes `NEXT_PUBLIC_CONVEX_URL`
into `.env.local`, pushes `convex/schema.ts`, and regenerates `convex/_generated`.
Leave it running while you work — it hot-pushes function changes.

Then set the shared secret **on the deployment**, matching `.env.local`:

```bash
npx convex env set INTERNAL_API_SECRET "$(grep '^INTERNAL_API_SECRET=' .env.local | cut -d= -f2)"
```

### 2. Polar

1. Create a **pay-what-you-want** product (custom amount pricing). Note its ID.
2. Settings → Developers → new access token, scope `checkouts:write`.
3. Settings → Webhooks → add `https://YOUR-DOMAIN/api/webhooks/polar`, subscribed to
   **`order.paid`**. Copy the signing secret.

Start on Polar's sandbox (`POLAR_SERVER=sandbox`) and flip to `production` when you
go live — the two are separate orgs with separate tokens, product IDs and secrets.

### 3. Run

```bash
cp .env.example .env.local   # then fill it in
npm install
npm run dev
```

With no Polar keys and `NODE_ENV != production`, checkout applies the bid directly
instead of dead-ending — handy for local testing, impossible in production.

---

## How the money flows

```
paste URL  →  /bid  →  POST /api/checkout  →  Polar hosted checkout
                            │                        │
                    listings.ensure()          order.paid webhook
                    (pending listing)                │
                                              POST /api/webhooks/polar
                                                       │
                                              listings.applyBid() → live
```

`applyBid` is idempotent on Polar's `checkoutId`, so webhook retries can't bid twice.
The bid recorded is the amount quoted on the board (`metadata.bid_amount`), not the
taxed total.

## Convex notes

Three things Postgres gave us that are now application logic:

- **Uniqueness.** Convex has no unique constraints. `urlKey`, `slug` and `checkoutId`
  are all enforced by index lookups inside mutations. Because Convex mutations are
  serializable transactions, read-then-write there is safe.
- **Row-level security.** There are no policies; the query functions in
  `convex/board.ts` are the entire public surface, and they never return
  `manageToken`.
- **Write authorization.** Convex functions are reachable by anyone with the
  deployment URL, so every mutation takes a shared `secret` argument checked against
  `INTERNAL_API_SECRET`. Only the Next.js server holds it.

The Polar webhook stays in a Next.js route rather than a Convex `httpAction` because
signature verification needs Node crypto and the raw body; Convex's default runtime
is a V8 isolate.

Ranking sorts in JS after an indexed read (capped at 500 live listings) since Convex
has no window functions. Fine at this size; revisit if the board gets big.

## Notable bits

- **One listing per product.** URLs normalize to a `urlKey` (no `www`, no query, no
  trailing slash). Paying again tops up the same row.
- **SSRF protection.** `/api/scrape` fetches user-supplied URLs, so hostnames are
  checked statically *and* re-checked after DNS resolution against private ranges.
  Responses capped at 512KB with an 8s timeout.
- **Click tracking.** Outbound links go through `/go/[slug]`, which counts the click
  and redirects in one mutation.
- **`decayAnchor`** sits unused on `listings`. It's there so "the melt" — bids
  decaying over time so the board can't freeze — can be switched on later.

## Layout

Three columns: sponsor slot + live traffic on the left, hero and board in the middle,
sponsor slot + recent bids on the right. Rails are sticky; the page self-refreshes
every 20s (`AutoRefresh`).
