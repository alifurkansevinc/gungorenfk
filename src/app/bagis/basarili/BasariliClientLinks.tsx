"use client";

import Link from "next/link";

export function BasariliClientLinks() {
  return (
    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        href="/"
        className="rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90 text-center"
      >
        Anasayfaya dön
      </Link>
      <Link
        href="/benim-kosem"
        className="rounded-xl border border-siyah/20 px-6 py-3 font-semibold text-siyah hover:bg-siyah/5 text-center"
      >
        Benim Köşem
      </Link>
    </div>
  );
}
