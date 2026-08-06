import Link from "next/link";
import type { Metadata } from "next";
import { OfflineReloadButton } from "@/components/OfflineReloadButton";

export const metadata: Metadata = {
  title: "Çevrimdışı | Güngören FK",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-siyah/45">Çevrimdışı</p>
      <h1 className="mt-3 font-display text-3xl font-bold text-siyah">Bağlantı yok</h1>
      <p className="mt-3 text-sm leading-relaxed text-siyah/65">
        İnternet bağlantınız kesilmiş görünüyor. Bağlantı gelince sayfayı yenileyin veya ana sayfaya dönün.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-full bg-bordo px-6 py-3 text-sm font-bold text-beyaz hover:bg-bordo-dark"
        >
          Ana sayfa
        </Link>
        <OfflineReloadButton />
      </div>
    </div>
  );
}
