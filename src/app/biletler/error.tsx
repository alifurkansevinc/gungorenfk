"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BiletlerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Biletler sayfası hatası:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-12 text-center">
      <div className="rounded-2xl border-2 border-bordo/30 bg-beyaz p-8 shadow-lg">
        <h2 className="text-xl font-bold text-siyah">Bir hata oluştu</h2>
        <p className="mt-2 text-sm text-siyah/70">
          Bilet sayfası yüklenirken bir sorun oluştu. Lütfen tekrar deneyin veya ana sayfaya dönün.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo-dark"
          >
            Tekrar dene
          </button>
          <Link
            href="/"
            className="rounded-xl border-2 border-siyah/20 px-6 py-3 font-semibold text-siyah hover:bg-siyah/5"
          >
            Anasayfa
          </Link>
        </div>
      </div>
    </div>
  );
}
