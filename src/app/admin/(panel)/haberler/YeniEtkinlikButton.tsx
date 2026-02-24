"use client";

import { useRouter } from "next/navigation";

export function YeniEtkinlikButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push("/admin/haberler/yeni")}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 focus:outline-none focus:ring-2 focus:ring-bordo focus:ring-offset-2"
    >
      + Yeni etkinlik
    </button>
  );
}
