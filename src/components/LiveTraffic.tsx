import { relativeTime } from "@/lib/format";
import type { ClickEvent } from "@/lib/types";
import Favicon from "./Favicon";
import Rail, { RailEmpty } from "./Rail";

export default function LiveTraffic({ items }: { items: ClickEvent[] }) {
  return (
    <Rail label="LIVE TRAFFIC">
      {items.length === 0 ? (
        <RailEmpty>No clicks yet.</RailEmpty>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 border-b border-line-soft px-2 py-3 last:border-b-0"
            >
              <Favicon src={item.listing?.faviconUrl ?? null} domain={item.listing?.domain ?? "?"} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{item.listing?.domain ?? "unknown"}</p>
                <p className="text-xs text-muted">got a click {relativeTime(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Rail>
  );
}
