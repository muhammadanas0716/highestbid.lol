"use client";

import { useMemo, useState } from "react";
import { money } from "@/lib/format";
import { MAX_BID, MIN_BID } from "@/lib/polar";
import type { ScrapedMeta } from "@/lib/types";
import Favicon from "./Favicon";

type Props = {
  meta: ScrapedMeta;
  /** Live bids of everyone else, so rank preview is instant. */
  rivalBids: number[];
  /** What this listing has already banked, if it's on the board. */
  existingBid: number;
};

/** Coarser steps as the numbers get bigger — nobody nudges $4,000 a dollar at a time. */
function step(value: number): number {
  if (value < 20) return 1;
  if (value < 100) return 5;
  if (value < 500) return 25;
  return 100;
}

export default function BidForm({ meta, rivalBids, existingBid }: Props) {
  const topBid = rivalBids.length > 0 ? Math.max(...rivalBids) : 0;
  const [amount, setAmount] = useState(() =>
    Math.min(Math.max(topBid + 1, MIN_BID), 25),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newTotal = existingBid + amount;
  const rank = useMemo(
    () => rivalBids.filter((v) => v > newTotal).length + 1,
    [rivalBids, newTotal],
  );

  const nudge = (direction: 1 | -1) => {
    setAmount((current) => {
      const delta = step(direction === 1 ? current : current - 1);
      const next = current + direction * delta;
      return Math.min(MAX_BID, Math.max(MIN_BID, next));
    });
  };

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: meta.url,
          amount,
          title: meta.title,
          description: meta.description,
          faviconUrl: meta.faviconUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setPending(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Couldn't reach the server. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[640px]">
      {/* what they're listing */}
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-5 py-5">
        <Favicon src={meta.faviconUrl} domain={meta.domain} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold">{meta.domain}</h1>
          {meta.description && (
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">
              {meta.description}
            </p>
          )}
        </div>
      </div>

      {/* the bid */}
      <div className="mt-5 rounded-2xl border border-line bg-surface px-5 py-8 text-center">
        <p className="text-xs font-bold tracking-[0.16em] text-accent uppercase">
          Set your bid
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={amount <= MIN_BID}
            aria-label="Lower bid"
            className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface-2 text-2xl leading-none text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:hover:border-line disabled:hover:text-muted"
          >
            −
          </button>

          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-4xl font-black text-accent">$</span>
            <input
              type="number"
              value={amount}
              min={MIN_BID}
              max={MAX_BID}
              aria-label="Bid amount in dollars"
              onChange={(e) => {
                const next = Math.floor(Number(e.target.value));
                if (Number.isFinite(next)) {
                  setAmount(Math.min(MAX_BID, Math.max(MIN_BID, next)));
                }
              }}
              className="w-[5ch] bg-transparent text-center text-5xl font-black text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={amount >= MAX_BID}
            aria-label="Raise bid"
            className="grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface-2 text-2xl leading-none text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
          >
            +
          </button>
        </div>

        <div className="mt-7 flex items-center justify-between rounded-xl border border-line bg-surface-2 px-5 py-4">
          <span className="text-xs font-bold tracking-[0.16em] text-muted uppercase">
            Rank
          </span>
          <span className="text-xl font-black tabular-nums">#{rank}</span>
        </div>

        {existingBid > 0 && (
          <p className="mt-3 text-xs text-muted">
            Already on the board at {money(existingBid)} — this tops you up to{" "}
            <strong className="text-accent">{money(newTotal)}</strong>.
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="cta-glow mt-6 w-full rounded-xl bg-accent px-6 py-4 text-base font-bold text-accent-ink transition-all hover:bg-accent-hot disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Opening checkout…" : `Pay ${money(amount)} & List`}
        </button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <p className="mt-4 text-xs leading-relaxed text-muted-dim">
          One payment. Your listing stays up and your rank only moves when someone
          else outbids you.
        </p>
      </div>
    </div>
  );
}
