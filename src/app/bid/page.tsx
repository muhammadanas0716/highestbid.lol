import Link from "next/link";
import BidForm from "@/components/BidForm";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getRivalBids, getStats } from "@/lib/queries";
import { resolvesPublicly, scrapeUrl } from "@/lib/scrape";
import { normalizeUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function BidPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;
  const stats = await getStats();
  const normalized = normalizeUrl(url ?? "");

  if (!normalized) {
    return (
      <Shell stats={stats}>
        <Problem
          title="That link didn't work."
          body="Paste a full product URL — something like acme.com or https://acme.com/launch."
        />
      </Shell>
    );
  }

  if (!(await resolvesPublicly(new URL(normalized.url).hostname))) {
    return (
      <Shell stats={stats}>
        <Problem
          title="Couldn't reach that domain."
          body={`Nothing answered at ${normalized.domain}. Check the spelling and try again.`}
        />
      </Shell>
    );
  }

  const [meta, { rivals, existingBid }] = await Promise.all([
    scrapeUrl(normalized),
    getRivalBids(normalized.urlKey),
  ]);

  return (
    <Shell stats={stats}>
      <BidForm meta={meta} rivalBids={rivals} existingBid={existingBid} />
    </Shell>
  );
}

function Shell({
  stats,
  children,
}: {
  stats: Awaited<ReturnType<typeof getStats>>;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header stats={stats} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-12">{children}</main>
      <Footer />
    </>
  );
}

function Problem({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-[560px] rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <h1 className="font-display text-3xl">{title}</h1>
      <p className="mt-3 text-muted">{body}</p>
      <Link
        href="/"
        className="mt-7 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hot"
      >
        Back to the board
      </Link>
    </div>
  );
}
