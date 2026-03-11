import Link from "next/link";
import { Package } from "lucide-react";
import { getOrderWithItemsForCurrentUser } from "@/lib/orders";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export default async function StoreQrPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; orderNumber?: string }>;
}) {
  const params = await searchParams;
  const code = params.code || "";
  const orderNumber = params.orderNumber || "";
  const order = orderNumber ? await getOrderWithItemsForCurrentUser(orderNumber) : null;

  if (!code) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg text-center">
          <p className="text-siyah/70">Teslim kodu bulunamadı.</p>
          <Link href="/benim-kosem" className="mt-4 inline-block rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90">
            Benim Köşem'e dön
          </Link>
        </div>
      </div>
    );
  }

  const qrData = `${baseUrl}/admin/teslim-al?code=${encodeURIComponent(code)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg">
        <Package className="mx-auto h-14 w-14 text-bordo" />
        <h1 className="mt-4 font-display text-xl font-bold text-siyah text-center">Mağazadan teslim</h1>
        <p className="mt-2 text-siyah/70 text-sm text-center">
          Mağazada bu QR kodu gösterin; personel okutunca siparişiniz teslim alınır.
        </p>
        {orderNumber && (
          <p className="mt-1 text-sm font-semibold text-siyah/80 text-center">Sipariş: {orderNumber}</p>
        )}
        <div className="mt-6 rounded-xl border-2 border-bordo/20 bg-bordo/5 p-6">
          <img src={qrUrl} alt="Teslim QR" width={320} height={320} className="mx-auto rounded-lg" />
          <p className="mt-3 font-mono text-sm font-bold text-siyah text-center">Kod: {code}</p>
        </div>

        {order && order.items.length > 0 && (
          <div className="mt-6 border-t border-siyah/10 pt-6">
            <h2 className="text-sm font-semibold text-siyah/80 mb-3">Sipariş içeriği</h2>
            <ul className="space-y-3">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 rounded-lg border border-siyah/10 bg-siyah/[0.02] p-3">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-14 w-14 rounded-lg object-cover border border-siyah/10 shrink-0" />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-siyah/10 flex items-center justify-center text-siyah/40 text-xs shrink-0">Ürün</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-siyah text-sm truncate">
                      {item.name}
                      {item.size ? ` · Beden: ${item.size}` : ""}
                    </p>
                    <p className="text-xs text-siyah/60">Adet: {item.quantity} · {item.price.toFixed(2)} ₺</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm font-bold text-siyah text-right">Toplam: {order.total.toFixed(2)} ₺</p>
          </div>
        )}

        <Link
          href="/benim-kosem"
          className="mt-8 w-full inline-block text-center rounded-xl bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo/90"
        >
          Benim Köşem'e dön
        </Link>
      </div>
    </div>
  );
}
