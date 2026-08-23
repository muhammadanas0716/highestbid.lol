import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getStats } from "@/lib/queries";
import { MAX_BID, MIN_BID } from "@/lib/polar";
import { money } from "@/lib/format";
import { SUPPORT_EMAIL } from "@/lib/site";

export const metadata = { title: "Rules — highestbid.lol" };
export const dynamic = "force-dynamic";

const RULES = [
  {
    title: "Rank is the bid",
    body: "Listings are ordered by total spend, highest first. Ties break in favour of whoever got there first.",
  },
  {
    title: "One listing per product",
    body: "Same URL means the same slot. Paying again tops up the listing you already have instead of creating a second one.",
  },
  {
    title: "Bids don't come back",
    body: "Payments are final. Getting overtaken isn't a refund event — it's the game. Top up if you want the spot back.",
  },
  {
    title: "Anyone can overtake you",
    body: "There's no lock on #1 and no cooldown. The board can change under you at any moment.",
  },
  {
    title: "Clicks are public",
    body: "Every outbound click is counted and shown on your listing. You can see exactly what your money bought.",
  },
  {
    title: "Nothing illegal, nothing malicious",
    body: "Malware, phishing, scams and illegal content get removed with no refund. Everything else is fair game.",
  },
];

export default async function RulesPage() {
  const stats = await getStats();

  return (
    <>
      <Header stats={stats} />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-16">
        <h1 className="font-display text-5xl leading-tight">
          The rules, <em className="text-accent">all of them.</em>
        </h1>

        <p className="mt-6 leading-relaxed text-muted">
          Bids run from {money(MIN_BID)} to {money(MAX_BID)}. Everything else is below.
        </p>

        <ul className="mt-10 space-y-px overflow-hidden rounded-2xl border border-line bg-surface">
          {RULES.map((rule, i) => (
            <li key={rule.title} className="border-b border-line-soft px-6 py-5 last:border-b-0">
              <div className="flex gap-4">
                <span className="font-mono text-sm font-bold text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 className="font-bold">{rule.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{rule.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <h2 id="sponsor" className="mt-14 scroll-mt-24 font-display text-3xl">
          The sponsor slots
        </h2>
        <p className="mt-4 leading-relaxed text-muted">
          The two cards flanking the board sit above the ranking entirely. They&rsquo;re
          rented by the day at <strong className="text-accent">$10 / day</strong> rather
          than bid on, so they don&rsquo;t move when the board does. Mail{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
            {SUPPORT_EMAIL}
          </a>{" "}
          to take one.
        </p>

        <h2 id="support" className="mt-14 scroll-mt-24 font-display text-3xl">
          Support
        </h2>
        <p className="mt-4 leading-relaxed text-muted">
          Something broken, a listing to report, or a takedown request? Mail{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent hover:underline">
            {SUPPORT_EMAIL}
          </a>
          . Include the listing URL and we&rsquo;ll get back to you.
        </p>

        <Link
          href="/"
          className="cta-glow mt-14 inline-block rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hot"
        >
          Back to the board
        </Link>
      </main>

      <Footer />
    </>
  );
}
