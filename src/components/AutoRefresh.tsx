"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Keeps the rails and the board moving without a full reload. */
export default function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);

  return null;
}
