import AutoRefresh from "@/components/AutoRefresh";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Leaderboard from "@/components/Leaderboard";
import LiveTraffic from "@/components/LiveTraffic";
import RecentBids from "@/components/RecentBids";
import SponsorCard from "@/components/SponsorCard";
import { getBoard, getLiveTraffic, getRecentBids, getSponsors, getStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [board, bids, clicks, stats, sponsors] = await Promise.all([
    getBoard(100),
    getRecentBids(12),
    getLiveTraffic(12),
    getStats(),
    getSponsors(),
  ]);

  const [leftSponsor, rightSponsor] = sponsors;

  return (
    <>
      <AutoRefresh />
      <Header stats={stats} />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pb-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(220px,285px)_minmax(0,1fr)_minmax(220px,285px)]">
          <aside className="order-2 flex flex-col gap-6 lg:order-1 lg:sticky lg:top-24 lg:self-start lg:pt-24">
            <SponsorCard sponsor={leftSponsor} />
            <LiveTraffic items={clicks} />
          </aside>

          <div className="order-1 min-w-0 lg:order-2">
            <Hero />
            <Leaderboard rows={board} />
          </div>

          <aside className="order-3 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start lg:pt-24">
            <SponsorCard sponsor={rightSponsor} />
            <RecentBids items={bids} />
          </aside>
        </div>
      </main>

      <Footer />
    </>
  );
}
