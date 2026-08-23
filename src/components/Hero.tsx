"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MIN_BID } from "@/lib/polar";

export default function Hero() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Paste a link first.");
      return;
    }
    if (!trimmed.includes(".")) {
      setError("That doesn't look like a real URL.");
      return;
    }
    setError(null);
    startTransition(() => {
      router.push(`/bid?url=${encodeURIComponent(trimmed)}`);
    });
  }

  return (
    <section className="pt-10 pb-8 text-center sm:pt-14">
      <h1 className="font-display text-[2.75rem] leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
        The top of this list
        <br />
        is <em className="text-accent">for sale.</em>
      </h1>

      <p className="mt-5 text-sm font-semibold tracking-[0.14em] text-accent uppercase">
        Listings start at just ${MIN_BID}
      </p>

      <form onSubmit={onSubmit} className="mx-auto mt-8 w-full max-w-[640px]">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste your product URL here..."
          autoComplete="off"
          spellCheck={false}
          aria-label="Product URL"
          className="w-full rounded-xl border border-line bg-surface px-5 py-4 text-base text-ink outline-none transition-colors placeholder:text-muted-dim focus:border-accent"
        />

        <button
          type="submit"
          disabled={pending}
          className="cta-glow mt-4 w-full max-w-[560px] rounded-xl bg-accent px-6 py-4 text-base font-bold text-accent-ink transition-all hover:bg-accent-hot disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Reading your link…" : "List My Product"}
        </button>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </form>
    </section>
  );
}
