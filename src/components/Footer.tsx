import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line-soft">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center gap-3 px-5 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <p>
          <span className="font-bold text-accent">highestbid.lol</span> — rank is the bid,
          nothing else.
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/about" className="transition-colors hover:text-ink">
            About
          </Link>
          <Link href="/rules" className="transition-colors hover:text-ink">
            Rules
          </Link>
        </nav>
      </div>
    </footer>
  );
}
