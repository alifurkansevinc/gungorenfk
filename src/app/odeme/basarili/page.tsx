"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Sparkles, Download } from "lucide-react";

type PickupInfo = {
  deliveryMethod: string;
  pickupDate: string | null;
  pickupCode: string | null;
} | null;

function OdemeBasariliContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const levelUp = searchParams.get("levelUp") === "1";
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

  const handlePdfDownload = useCallback(() => {
    if (!isStorePickup || !qrUrl || !pickupInfo?.pickupCode) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Teslim QR - ${orderNumber}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:2rem;max-width:400px;margin:0 auto}
      h1{font-size:1.25rem;color:#333} p{margin:0.5rem 0;color:#555}
      img{border:1px solid #ddd;border-radius:8px;margin:1rem 0}
      .code{font-family:monospace;font-weight:bold;font-size:1rem}
      .note{margin-top:2rem;font-size:12px;color:#666}</style>
      </head><body>
      <h1>Güngören Store – Mağazadan teslim</h1>
      <p><strong>Sipariş no:</strong> ${orderNumber}</p>
      <p><strong>Teslim tarihi:</strong> ${pickupDateFormatted}</p>
      <img src="${qrUrl}" alt="QR" width="256" height="256" />
      <p class="code">Kod: ${pickupInfo.pickupCode}</p>
      <p class="note">Mağazada bu QR kodu gösterin. Yazdır penceresinden &quot;PDF olarak kaydet&quot; ile indirebilirsiniz.</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 400);
  }, [isStorePickup, qrUrl, pickupInfo?.pickupCode, orderNumber, pickupDateFormatted]);

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
            <p className="font-semibold text-siyah">QR kod ile mağazadan teslim al</p>
            <p className="mt-1 text-sm text-siyah/70">Teslim tarihiniz: <strong>{pickupDateFormatted}</strong></p>
            <p className="mt-3 text-xs text-siyah/60">Mağazada bu QR kodu gösterin; personel okutunca sipariş tamamlanır.</p>
            {qrUrl && (
              <div className="mt-4 flex justify-center">
                <img src={qrUrl} alt="Teslim kodu QR" width={256} height={256} className="rounded-lg border border-siyah/10" />
              </div>
            )}
            <p className="mt-3 font-mono text-sm font-bold text-siyah">Kod: {pickupInfo?.pickupCode}</p>
            <button
              type="button"
              onClick={handlePdfDownload}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border-2 border-bordo bg-bordo/10 px-4 py-2.5 text-sm font-semibold text-bordo hover:bg-bordo/20"
            >
              <Download className="h-4 w-4" />
              PDF olarak indir
            </button>
            <p className="mt-3 text-xs text-siyah/60">Taraftar iseniz bu QR kodu <Link href="/benim-kosem" className="font-medium text-bordo hover:underline">Benim Köşem</Link> sayfasında da görebilirsiniz.</p>
          </div>
        )}

        {!isStorePickup && (
          <p className="mt-4 text-sm text-siyah/70">
            En kısa sürede kargoya verilecektir. Sorularınız için kulüp ile iletişime geçebilirsiniz.
          </p>
        )}

        {levelUp && (
          <div className="mt-6 rounded-xl border-2 border-bordo/30 bg-bordo/10 p-4">
            <Sparkles className="mx-auto h-10 w-10 text-bordo" />
            <p className="mt-2 font-bold text-bordo">Tebrikler! Seviye atladınız!</p>
            <p className="mt-1 text-sm text-siyah/80">
              Mağaza bareminiz doldu; taraftar rozetiniz bir üst seviyeye geçti. Benim Köşem’den görebilirsiniz.
            </p>
          </div>
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
