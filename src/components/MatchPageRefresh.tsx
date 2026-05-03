"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Canlı / program maçında durum güncellemesi için periyodik yenileme */
export function MatchPageRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      router.refresh();
    }, 60_000);
    return () => clearInterval(t);
  }, [enabled, router]);
  return null;
}
