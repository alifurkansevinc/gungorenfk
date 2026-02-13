"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const MESSAGES: Record<string, string> = {
  token_missing: "Ödeme oturumu bulunamadı.",
  order_not_found: "Sipariş bulunamadı.",
  payment_failed: "Ödeme işlemi başarısız oldu.",
};

function OdemeHataContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error") || "";
  const message = MESSAGES[errorCode] || errorCode || "Bir hata oluştu.";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-red-800">Ödeme başarısız</h1>
        <p className="mt-2 text-red-700">{message}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/odeme"
            className="rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz hover:bg-bordo-dark"
          >
            Tekrar dene
          </Link>
          <Link
            href="/sepet"
            className="rounded-xl border-2 border-siyah/20 px-6 py-3 font-bold text-siyah hover:bg-siyah/5"
          >
            Sepete dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OdemeHataPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-16 sm:px-6 text-center text-siyah/60">Yükleniyor...</div>}>
      <OdemeHataContent />
    </Suspense>
  );
}
