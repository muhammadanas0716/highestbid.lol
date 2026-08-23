import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SuccessPage() {
  const stats = await getStats();

  return (
    <>
      {/* the webhook may still be in flight — keep the page fresh */}
      <AutoRefresh intervalMs={5_000} />
      <Header stats={stats} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-16">
        <div className="mx-auto max-w-[560px] rounded-2xl border border-line bg-surface px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-3xl font-black text-accent-ink">
            $
          </span>
          <h1 className="mt-6 font-display text-4xl">You&rsquo;re on the board.</h1>
          <p className="mt-3 leading-relaxed text-muted">
            Payment went through. Your listing appears as soon as the receipt clears —
            usually a second or two. It&rsquo;ll hold its rank until somebody pays more.
          </p>
          <Link
            href="/"
            className="cta-glow mt-8 inline-block rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hot"
          >
            See the board
          </Link>
        </div>
      </main>

      <Footer />
    </>
  );
}
