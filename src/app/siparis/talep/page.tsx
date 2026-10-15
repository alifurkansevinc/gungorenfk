import Link from "next/link";
import { listServiceOrderByToken } from "@/lib/order-service";
import { ServiceRequestPanel } from "@/components/order-service/ServiceRequestPanel";

export const metadata = {
  title: "İade ve beden değişimi | Güngören FK",
  robots: { index: false, follow: false },
};

export default async function SiparisTalepPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string; token?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.orderNumber?.trim() || "";
  const token = params.token?.trim() || "";
  const loaded = orderNumber && token ? await listServiceOrderByToken(orderNumber, token) : null;

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/" className="text-sm font-medium text-bordo hover:underline">
          Anasayfa
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold text-siyah">İade ve beden değişimi</h1>
        <p className="mt-2 text-sm leading-6 text-siyah/70">
          Ödeme sonrası sayfadaki bağlantıyı açın ya da sipariş numarası ile makbuz kodunu girin. Talep, teslimattan sonra 14 gün açıktır. Taraftar hesabınız varsa{" "}
          <Link href="/benim-kosem/iade-degisim" className="font-medium text-bordo hover:underline">
            Benim Köşem
          </Link>{" "}
          üzerinden de açabilirsiniz.
        </p>

        <form action="/siparis/talep" method="get" className="mt-6 space-y-3 rounded-2xl border border-siyah/10 bg-beyaz p-4 shadow-sm">
          <label className="block text-xs font-medium text-siyah/70">
            Sipariş numarası
            <input
              name="orderNumber"
              defaultValue={orderNumber}
              required
              className="mt-1 w-full rounded-lg border border-siyah/15 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-siyah/70">
            Makbuz kodu
            <input
              name="token"
              defaultValue={token}
              required
              className="mt-1 w-full rounded-lg border border-siyah/15 px-3 py-2 text-sm"
            />
          </label>
          <button type="submit" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90">
            Siparişi getir
          </button>
        </form>

        <div className="mt-6">
          {loaded && "error" in loaded && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{loaded.error}</p>}
          {loaded && "order" in loaded && <ServiceRequestPanel orders={[loaded.order]} receiptToken={token} />}
        </div>
      </div>
    </div>
  );
}
