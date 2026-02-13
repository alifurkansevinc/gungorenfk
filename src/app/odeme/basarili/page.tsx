"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

type PickupInfo = {
  deliveryMethod: string;
  pickupDate: string | null;
  pickupCode: string | null;
} | null;

function OdemeBasariliContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const { clearCart } = useCart();
  const [pickupInfo, setPickupInfo] = useState<PickupInfo>(null);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderNumber) return;
    fetch(`/api/orders/pickup-info?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((d) => d.success && d.data && setPickupInfo(d.data))
      .catch(() => {});
  }, [orderNumber]);

  const isStorePickup = pickupInfo?.deliveryMethod === "store_pickup" && pickupInfo.pickupCode;
  const pickupDateFormatted = pickupInfo?.pickupDate
    ? new Date(pickupInfo.pickupDate + "T12:00:00").toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const qrUrl =
    typeof window !== "undefined" && isStorePickup
      ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
          `${window.location.origin}/admin/teslim-al?code=${pickupInfo?.pickupCode}`
        )}`
      : "";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-green-800">Ödeme başarılı</h1>
        <p className="mt-2 text-green-700">Siparişiniz alındı.</p>
        {orderNumber && (
          <p className="mt-4 font-mono text-lg font-semibold text-siyah">Sipariş no: {orderNumber}</p>
        )}

        {isStorePickup && (
          <div className="mt-6 rounded-xl border-2 border-green-300 bg-beyaz p-6">
            <p className="font-semibold text-siyah">Güngören Store&apos;dan teslim al</p>
            <p className="mt-1 text-sm text-siyah/70">Teslim tarihiniz: <strong>{pickupDateFormatted}</strong></p>
            <p className="mt-3 text-xs text-siyah/60">Mağazada bu QR kodu gösterin; personel okutunca sipariş tamamlanır.</p>
            {qrUrl && (
              <div className="mt-4 flex justify-center">
                <img src={qrUrl} alt="Teslim kodu QR" width={256} height={256} className="rounded-lg border border-siyah/10" />
              </div>
            )}
            <p className="mt-3 font-mono text-sm font-bold text-siyah">Kod: {pickupInfo?.pickupCode}</p>
          </div>
        )}

        {!isStorePickup && (
          <p className="mt-4 text-sm text-siyah/70">
            En kısa sürede kargoya verilecektir. Sorularınız için kulüp ile iletişime geçebilirsiniz.
          </p>
        )}

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
