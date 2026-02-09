import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UrunSilButton } from "./UrunSilButton";

export default async function AdminMagazaPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("store_products")
    .select("id, name, slug, price, image_url, is_active, sort_order")
    .order("sort_order");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Mağaza Ürünleri</h1>
          <p className="mt-1 text-siyah/70">Ürün ekle/düzenle. Görsel URL veya ileride dosya yükleme ile eklenebilir.</p>
        </div>
        <Link href="/admin/magaza/yeni" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
          + Yeni ürün
        </Link>
      </div>
      <div className="mt-8 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full text-left">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-siyah/70">Sıra</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-siyah/70">Ürün</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-siyah/70">Slug</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-siyah/70">Fiyat</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-siyah/70">Durum</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!products || products.length === 0) ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-siyah/60">Henüz ürün yok. &quot;Yeni ürün&quot; ile ekleyin.</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 text-sm">{p.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-siyah">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-siyah/70">{p.slug}</td>
                  <td className="px-4 py-3 font-semibold text-bordo">{Number(p.price).toFixed(2)} ₺</td>
                  <td className="px-4 py-3">{p.is_active ? <span className="text-green-600">Aktif</span> : <span className="text-siyah/50">Pasif</span>}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/magaza/duzenle/${p.id}`} className="text-bordo font-medium hover:underline mr-4">Düzenle</Link>
                    <UrunSilButton productId={p.id} productName={p.name} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
