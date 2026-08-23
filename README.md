# highestbid.lol

A paid leaderboard. Paste a link, pay what you want, take a spot. Rank is total
spend, highest first — no algorithm, no upvotes, no editor.

Next.js 16 (App Router) · Supabase · Polar · Tailwind v4.

---

## Setup

### 1. Supabase

Create a project, then run the migration in the SQL editor:

```
supabase/migrations/0001_init.sql
```

It creates `listings`, `bids`, `click_events` and `sponsor_slots`, the `board` and
`site_stats` views, the `apply_bid` / `register_click` functions, and RLS policies.
Everything public is read-only; all writes go through the service role.

### 2. Polar

1. Create a **pay-what-you-want** product (custom amount pricing). Note its ID.
2. Settings → Developers → new access token.
3. Settings → Webhooks → add `https://YOUR-DOMAIN/api/webhooks/polar`, subscribed to
   **`order.paid`**. Copy the signing secret.

Start on Polar's sandbox (`POLAR_SERVER=sandbox`) and flip to `production` when you go live.

### 3. Env

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
                    creates a `pending`         order.paid webhook
                    listing row                        │
                                              POST /api/webhooks/polar
                                                       │
                                              apply_bid() → status: live
```

`apply_bid` is idempotent on Polar's `checkout_id`, so webhook retries can't bid twice.
The bid recorded is the amount quoted on the board (`metadata.bid_amount`), not the
taxed total.

## Notable bits

- **One listing per product.** URLs are normalized to a `url_key` (no `www`, no query,
  no trailing slash) with a unique constraint. Paying again tops up the same row.
- **SSRF protection.** `/api/scrape` fetches user-supplied URLs, so hostnames are
  checked statically *and* re-checked after DNS resolution against private ranges.
  Responses are capped at 512KB with an 8s timeout.
- **Click tracking.** Outbound links go through `/go/[slug]`, which counts the click
  and redirects.
- **`decay_anchor`** sits unused on `listings`. It's there so "the melt" — bids
  decaying over time so the board can't freeze — can be switched on later without a
  migration.

## Layout

Three columns: sponsor slot + live traffic on the left, hero and board in the middle,
sponsor slot + recent bids on the right. Rails are sticky and the page self-refreshes
every 20s (`AutoRefresh`).
