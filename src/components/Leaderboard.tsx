import { compact, money } from "@/lib/format";
import type { BoardRow } from "@/lib/types";
import Favicon from "./Favicon";

export default function Leaderboard({ rows }: { rows: BoardRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface px-6 py-20 text-center">
        <p className="font-display text-3xl">Nobody has bid yet.</p>
        <p className="mt-2 text-muted">
          The whole board is empty. One dollar takes #1 right now.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {rows.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </div>
  );
}

function Row({ row }: { row: BoardRow }) {
  const tint = row.rank === 1 ? "rank-1" : row.rank === 2 ? "rank-2" : row.rank === 3 ? "rank-3" : "";

  return (
    <a
      href={`/go/${row.slug}`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`group flex items-center gap-4 border-b border-line-soft px-4 py-5 transition-colors last:border-b-0 hover:bg-surface-2 sm:gap-5 sm:px-6 ${tint}`}
    >
      <span
        className={`w-9 shrink-0 text-center font-mono text-sm font-bold sm:w-11 sm:text-base ${
          row.rank <= 3 ? "text-accent" : "text-muted-dim"
        }`}
      >
        #{row.rank}
      </span>

      <Favicon src={row.favicon_url} domain={row.domain} size="md" />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[1.05rem] font-bold group-hover:text-accent">
          {row.domain}
        </h3>
        {row.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted">
            {row.description}
          </p>
        )}
        <p className="mt-1.5 text-xs font-semibold text-accent">
          {compact(row.clicks)} clicks
        </p>
      </div>

      <span className="shrink-0 text-lg font-bold tabular-nums sm:text-xl">
        {money(row.bid_value)}
      </span>
    </a>
  );
}
