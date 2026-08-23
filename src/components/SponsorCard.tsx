import Link from "next/link";
import { truncate } from "@/lib/format";
import { SPONSOR_DAILY_RATE as DAILY_RATE } from "@/lib/site";
import type { Sponsor } from "@/lib/types";
import Favicon from "./Favicon";

export default function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  if (!sponsor.listing) {
    return (
      <Link
        href="/rules#sponsor"
        className="group relative block rounded-2xl border border-dashed border-line bg-surface/40 px-5 py-6 text-center transition-colors hover:border-accent"
      >
        <span className="absolute top-3 right-4 text-[0.6rem] font-bold tracking-[0.14em] text-muted-dim">
          SPONSORED
        </span>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface-2 text-lg font-black text-accent">
          $
        </span>
        <p className="mt-3 text-sm font-bold group-hover:text-accent">
          Promote your project here
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Guaranteed visibility, above the board. Rent this spot for{" "}
          <strong className="text-accent">${DAILY_RATE} / day</strong>.
        </p>
      </Link>
    );
  }

  const { listing } = sponsor;

  return (
    <a
      href={`/go/${listing.slug}`}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="group relative block rounded-2xl border border-line bg-surface px-5 py-6 text-center transition-colors hover:border-accent"
    >
      <span className="absolute top-3 right-4 text-[0.6rem] font-bold tracking-[0.14em] text-muted-dim">
        SPONSORED
      </span>
      <span className="mx-auto block w-fit">
        <Favicon src={listing.faviconUrl} domain={listing.domain} size="md" />
      </span>
      <p className="mt-3 text-sm font-bold group-hover:text-accent">{listing.domain}</p>
      {listing.description && (
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {truncate(listing.description, 90)}
        </p>
      )}
    </a>
  );
}
