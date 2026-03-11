"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Sparkles, Download, Home, User } from "lucide-react";

type ReceiptItem = { name: string; price: number; quantity: number };
type ReceiptData = {
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  deliveryMethod: string;
  pickupDate: string | null;
  pickupCode: string | null;
  createdAt: string;
  items: ReceiptItem[];
  guestName?: string | null;
  guestEmail?: string | null;
} | null;

function OdemeBasariliContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "";
  const levelUp = searchParams.get("levelUp") === "1";
  const { clearCart } = useCart();
  const [receipt, setReceipt] = useState<ReceiptData>(null);
  const [loading, setLoading] = useState(!!orderNumber);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      clearCart();
    } catch {
      // CartContext might not be ready
    }
  }, [clearCart]);

  useEffect(() => {
    if (!orderNumber.trim()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/orders/receipt?orderNumber=${encodeURIComponent(orderNumber)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setReceipt(d.data);
        else setError(d.error || "Sipariş yüklenemedi");
      })
      .catch(() => setError("Sipariş bilgisi alınamadı"))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const isStorePickup = receipt?.deliveryMethod === "store_pickup" && receipt.pickupCode;
  const pickupDateFormatted = receipt?.pickupDate
    ? new Date(receipt.pickupDate + "T12:00:00").toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const qrUrl =
    typeof window !== "undefined" && isStorePickup
      ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
          `${window.location.origin}/admin/teslim-al?code=${receipt?.pickupCode}`
        )}`
      : "";

  const handlePdfDownload = useCallback(() => {
    if (!isStorePickup || !qrUrl || !receipt?.pickupCode) return;
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
      <p><strong>Sipariş no:</strong> ${receipt.orderNumber}</p>
      <p><strong>Teslim tarihi:</strong> ${pickupDateFormatted}</p>
      <img src="${qrUrl}" alt="QR" width="256" height="256" />
      <p class="code">Kod: ${receipt.pickupCode}</p>
      <p class="note">Mağazada bu QR kodu gösterin. Yazdır penceresinden &quot;PDF olarak kaydet&quot; ile indirebilirsiniz.</p>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
    }, 400);
  }, [isStorePickup, qrUrl, receipt?.pickupCode, receipt?.orderNumber, pickupDateFormatted]);

  const createdDateFormatted = receipt?.createdAt
    ? new Date(receipt.createdAt).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-green-800 text-center">Ödeme başarılı</h1>
        <p className="mt-2 text-green-700 text-center">Siparişiniz alındı.</p>

        {loading && <p className="mt-6 text-center text-siyah/60">Sipariş detayları yükleniyor…</p>}
        {error && !receipt && <p className="mt-6 text-center text-red-600">{error}</p>}

        {receipt && !loading && (
          <div className="mt-6 space-y-6 text-left">
            <div className="rounded-xl border border-siyah/10 bg-beyaz p-4">
              <p className="text-xs text-siyah/60">Sipariş no</p>
              <p className="font-mono text-lg font-bold text-siyah">{receipt.orderNumber}</p>
              {createdDateFormatted && <p className="mt-1 text-sm text-siyah/70">{createdDateFormatted}</p>}
              {(receipt.guestName || receipt.guestEmail) && (
                <p className="mt-2 text-sm text-siyah/70">{receipt.guestName}{receipt.guestEmail ? ` · ${receipt.guestEmail}` : ""}</p>
              )}
            </div>
            <div className="rounded-xl border border-siyah/10 bg-beyaz overflow-hidden">
              <p className="border-b border-siyah/10 px-4 py-2 text-sm font-semibold text-siyah/80">Sipariş detayı</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-siyah/5 bg-siyah/[0.03]">
                    <th className="px-4 py-2 text-left font-medium text-siyah/70">Ürün</th>
                    <th className="px-4 py-2 text-right font-medium text-siyah/70">Adet</th>
                    <th className="px-4 py-2 text-right font-medium text-siyah/70">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {receipt.items.map((item, i) => (
                    <tr key={i} className="border-b border-siyah/5">
                      <td className="px-4 py-2 text-siyah/90">{item.name}</td>
                      <td className="px-4 py-2 text-right text-siyah/80">{item.quantity}</td>
                      <td className="px-4 py-2 text-right font-medium text-siyah">{(item.price * item.quantity).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-siyah/10 px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between text-siyah/80"><span>Ara toplam</span><span>{receipt.subtotal.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span></div>
                {receipt.shippingCost > 0 && <div className="flex justify-between text-siyah/80"><span>Kargo</span><span>{receipt.shippingCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span></div>}
                <div className="flex justify-between font-bold text-siyah pt-1"><span>Toplam</span><span>{receipt.total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</span></div>
              </div>
            </div>
          </div>
        )}

        {receipt && isStorePickup && (
          <div className="mt-6 rounded-xl border-2 border-green-300 bg-beyaz p-6">
            <p className="font-semibold text-siyah">QR kod ile mağazadan teslim al</p>
            <p className="mt-1 text-sm text-siyah/70">Teslim tarihiniz: <strong>{pickupDateFormatted}</strong></p>
            <p className="mt-3 text-xs text-siyah/60">Mağazada bu QR kodu gösterin; personel okutunca sipariş tamamlanır.</p>
            {qrUrl && (
              <div className="mt-4 flex justify-center">
                <img src={qrUrl} alt="Teslim kodu QR" width={256} height={256} className="rounded-lg border border-siyah/10" />
              </div>
            )}
            <p className="mt-3 font-mono text-sm font-bold text-siyah">Kod: {receipt?.pickupCode}</p>
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

        {receipt && receipt.deliveryMethod !== "store_pickup" && (
          <p className="mt-4 text-sm text-siyah/70">
            Siparişiniz en kısa sürede kargoya verilecektir. Sorularınız için kulüp ile iletişime geçebilirsiniz.
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

        {!orderNumber && !loading && <p className="mt-6 text-center text-siyah/70">Sipariş numarası bulunamadı. Sorun yaşıyorsanız iletişime geçin.</p>}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-xl bg-siyah px-6 py-3 font-semibold text-beyaz hover:bg-siyah/90">
            <Home className="h-5 w-5" />
            Anasayfa
          </Link>
          <Link href="/benim-kosem" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-bordo bg-bordo/10 px-6 py-3 font-semibold text-bordo hover:bg-bordo/20">
            <User className="h-5 w-5" />
            Benim Köşem
          </Link>
        </div>
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
