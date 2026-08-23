import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getStats } from "@/lib/queries";

export const metadata = { title: "About — highestbid.lol" };
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <>
      <Header stats={stats} />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-5 py-16">
        <h1 className="font-display text-5xl leading-tight">
          No algorithm. <em className="text-accent">Just money.</em>
        </h1>

        <div className="mt-8 space-y-5 leading-relaxed text-muted">
          <p>
            Every other place you can post a product decides for you. Upvotes, karma
            thresholds, a moderator who didn&rsquo;t like your screenshot, a ranking model
            nobody will explain. You post, you wait, you get buried.
          </p>
          <p>
            This board has one rule instead. <strong className="text-ink">Rank is the bid.</strong>{" "}
            Whoever has paid the most sits at #1, and everybody else lines up underneath in
            plain descending order. No editor, no feed, no timing games.
          </p>
          <p>
            Listings start at ${1}. Anyone can overtake you at any time, and you can always
            climb back by topping up. That&rsquo;s the whole product.
          </p>
        </div>

        <h2 className="mt-14 font-display text-3xl">How it works</h2>
        <ol className="mt-6 space-y-6">
          {[
            {
              n: "01",
              title: "Paste your URL",
              body: "We pull the title, description and icon off your page. Takes about two minutes and there's no account to make.",
            },
            {
              n: "02",
              title: "Pay to rank",
              body: "Your rank is your total spend. Pick any amount — the board shows you exactly where that lands before you pay.",
            },
            {
              n: "03",
              title: "Get seen",
              body: "Visitors read the board top-down. The higher you sit, the more clicks land on your product, and every click is counted publicly.",
            },
          ].map((s) => (
            <li key={s.n}>
              <p className="font-mono text-sm font-bold text-accent">{s.n}</p>
              <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
              <p className="mt-1 leading-relaxed text-muted">{s.body}</p>
            </li>
          ))}
        </ol>

        <Link
          href="/"
          className="cta-glow mt-14 inline-block rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-accent-ink transition-colors hover:bg-accent-hot"
        >
          List your product
        </Link>
      </main>

      <Footer />
    </>
  );
}
