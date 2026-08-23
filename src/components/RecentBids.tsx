import { money, relativeTime } from "@/lib/format";
import type { RecentBid } from "@/lib/types";
import Favicon from "./Favicon";
import Rail, { RailEmpty } from "./Rail";

export default function RecentBids({ items }: { items: RecentBid[] }) {
  return (
    <Rail label="RECENT BIDS">
      {items.length === 0 ? (
        <RailEmpty>No bids yet. Be the first.</RailEmpty>
      ) : (
        <ul>
          {items.map((bid) => (
            <li
              key={bid.id}
              className="flex items-center gap-3 border-b border-line-soft px-2 py-3 last:border-b-0"
            >
              <Favicon src={bid.listing?.favicon_url ?? null} domain={bid.listing?.domain ?? "?"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{bid.listing?.domain ?? "unknown"}</p>
                <p className="text-xs text-muted">{relativeTime(bid.created_at)}</p>
              </div>
              <span className="shrink-0 text-base font-bold text-accent tabular-nums">
                {money(bid.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Rail>
  );
}
