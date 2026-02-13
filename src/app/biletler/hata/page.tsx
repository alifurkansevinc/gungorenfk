"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AlertCircle } from "lucide-react";

function HataContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Ödeme sırasında bir hata oluştu.";

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-red-200 bg-beyaz p-8 shadow-lg text-center">
        <AlertCircle className="mx-auto h-16 w-16 text-red-600" />
        <h1 className="mt-4 font-display text-xl font-bold text-siyah">Bilet alınamadı</h1>
        <p className="mt-2 text-siyah/70">{decodeURIComponent(error)}</p>
        <Link
          href="/biletler"
          className="mt-6 inline-block rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90"
        >
          Tekrar dene
        </Link>
      </div>
    </div>
  );
}

export default function BiletlerHataPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <HataContent />
    </Suspense>
  );
}
