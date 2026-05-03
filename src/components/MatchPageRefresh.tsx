"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canlı / program maçında durum ve skor güncellemesi için periyodik yenileme */
export function MatchPageRefresh({ enabled, intervalMs = 60_000 }: { enabled: boolean; intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      router.refresh();
    }, intervalMs);
    return () => clearInterval(t);
  }, [enabled, intervalMs, router]);
  return null;
}
