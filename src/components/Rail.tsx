import type { ReactNode } from "react";

export default function Rail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="rail">
      <h2 className="rail-label">{label}</h2>
      <div className="max-h-[560px] overflow-y-auto px-3 py-2">{children}</div>
    </section>
  );
}

export function RailEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-2 py-10 text-center text-sm text-muted-dim">{children}</p>
  );
}
