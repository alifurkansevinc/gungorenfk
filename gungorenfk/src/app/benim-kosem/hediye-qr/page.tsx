"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Gift } from "lucide-react";

function HediyeQrContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";
  const productName = searchParams.get("productName") || "Hediye ürün";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const qrData = origin && code ? `${origin}/admin/teslim-al?code=${encodeURIComponent(code)}` : "";
  const qrUrl = code && qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData)}`
    : "";

  if (!code) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg text-center">
          <p className="text-siyah/70">Hediye kodu bulunamadı.</p>
          <Link href="/benim-kosem" className="mt-4 inline-block rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90">
            Benim Köşem'e dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg text-center">
        <Gift className="mx-auto h-14 w-14 text-bordo" />
        <h1 className="mt-4 font-display text-xl font-bold text-siyah">Hediye teslim</h1>
        <p className="mt-2 text-siyah/70 text-sm">
          Mağazada bu QR kodu gösterin; personel okutunca hediyeniz teslim alınır.
        </p>
        <p className="mt-2 text-sm font-semibold text-siyah/80">Hediye: {decodeURIComponent(productName)}</p>
        <div className="mt-6 rounded-xl border-2 border-bordo/20 bg-bordo/5 p-6">
          {qrUrl && (
            <img src={qrUrl} alt="Hediye teslim QR" width={320} height={320} className="mx-auto rounded-lg" />
          )}
          <p className="mt-3 font-mono text-sm font-bold text-siyah">Kod: {code}</p>
        </div>
        <Link
          href="/benim-kosem"
          className="mt-8 inline-block rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90"
        >
          Benim Köşem'e dön
        </Link>
      </div>
    </div>
  );
}

export default function HediyeQrPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>}>
      <HediyeQrContent />
    </Suspense>
  );
}
