import Link from "next/link";
import { compact, money } from "@/lib/format";
import type { SiteStats } from "@/lib/types";

export default function Header({ stats }: { stats: SiteStats }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent text-lg font-black text-accent-ink">
            $
          </span>
          <span className="text-[1.35rem] font-bold tracking-tight text-accent">
            highestbid
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          <span className="hidden rounded-full bg-accent-soft px-4 py-2 text-sm font-bold text-accent md:inline">
            Made {money(stats.revenue)} till now
          </span>

          <nav className="hidden items-center gap-5 text-[0.95rem] text-muted sm:flex">
            <Link href="/about" className="transition-colors hover:text-ink">
              About
            </Link>
            <Link href="/rules" className="transition-colors hover:text-ink">
              Rules
            </Link>
          </nav>

          <div className="flex items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="pulse-dot h-2 w-2 rounded-full bg-live" />
              <strong className="font-bold">{compact(stats.live_listings)}</strong>
              <span className="text-muted">Live</span>
            </span>
            <span className="h-4 w-px bg-line" />
            <span className="flex items-center gap-1.5">
              <strong className="font-bold">{compact(stats.total_clicks)}</strong>
              <span className="text-muted">Clicks</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
