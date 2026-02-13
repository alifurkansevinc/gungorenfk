"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";

function OdemeBasariliContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-green-800">Ödeme başarılı</h1>
        <p className="mt-2 text-green-700">Siparişiniz alındı.</p>
        {orderNumber && (
          <p className="mt-4 font-mono text-lg font-semibold text-siyah">Sipariş no: {orderNumber}</p>
        )}
        <p className="mt-4 text-sm text-siyah/70">
          En kısa sürede kargoya verilecektir. Sorularınız için kulüp ile iletişime geçebilirsiniz.
        </p>
        <Link
          href="/magaza"
          className="mt-8 inline-block rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz hover:bg-bordo-dark"
        >
          Mağazaya dön
        </Link>
      </div>
    </div>
  );
}

export default function OdemeBasariliPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-16 sm:px-6 text-center text-siyah/60">Yükleniyor...</div>}>
      <OdemeBasariliContent />
    </Suspense>
  );
}
