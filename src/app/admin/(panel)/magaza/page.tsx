import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { UrunSilButton } from "./UrunSilButton";
import { Plus, Package } from "lucide-react";
import { getSizeGroupLabel, getSizeLabel } from "@/lib/store-sizes";

function formatProductSizes(sizes: string[] | null | undefined): string {
  if (!sizes?.length) return "Tek Beden";
  return sizes.map(getSizeLabel).join(", ");
}

function totalStock(stockBySize: Record<string, number> | null | undefined): number {
  if (!stockBySize) return 0;
  return Object.values(stockBySize).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

export default async function AdminMagazaPage() {
  const supabase = await getAdminSupabase();
  const { data: products } = await supabase
    .from("store_products")
    .select("id, name, slug, sku, price, image_url, is_active, sort_order, sizes, stock_by_size, size_group")
    .order("sort_order");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mağaza Ürünleri</h1>
          <p className="mt-1 text-gray-500">Ürün ekleyin, düzenleyin. Görsel URL veya ileride dosya yükleme.</p>
        </div>
        <Link
          href="/admin/magaza/yeni"
          className="inline-flex items-center gap-2 rounded-xl bg-bordo px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-bordo/90"
        >
          <Plus className="h-4 w-4" />
          Yeni ürün
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-sm text-gray-500">
                <th className="p-4 font-medium">Sıra</th>
                <th className="p-4 font-medium">Ürün</th>
                <th className="p-4 font-medium">Stok kodu</th>
                <th className="p-4 font-medium">Beden takımı</th>
                <th className="p-4 font-medium">Bedenler</th>
                <th className="p-4 font-medium">Toplam stok</th>
                <th className="p-4 font-medium">Fiyat</th>
                <th className="p-4 font-medium">Durum</th>
                <th className="p-4 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {(!products || products.length === 0) ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-500">
                    <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p className="font-medium">Henüz ürün yok</p>
                    <p className="mt-1 text-sm text-gray-400">Yeni ürün ile ekleyin.</p>
                    <Link href="/admin/magaza/yeni" className="mt-3 inline-block text-sm font-medium text-bordo hover:underline">
                      Yeni ürün ekle
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const sizes = (p as { sizes?: string[] }).sizes;
                  const sizeGroup = (p as { size_group?: string }).size_group;
                  const stockBySize = (p as { stock_by_size?: Record<string, number> }).stock_by_size;
                  const stockTotal = totalStock(stockBySize);
                  return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600">{p.sort_order}</td>
                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                    <td className="p-4 text-sm font-mono text-bordo">{p.sku ?? "—"}</td>
                    <td className="p-4 text-sm text-gray-600">{getSizeGroupLabel(sizeGroup)}</td>
                    <td className="p-4 text-sm text-gray-600">{formatProductSizes(sizes)}</td>
                    <td className="p-4 text-sm text-gray-700">
                      <span className={stockTotal === 0 ? "font-medium text-red-600" : ""}>{stockTotal}</span>
                    </td>
                    <td className="p-4 font-semibold text-bordo">
                      {Number(p.price).toFixed(2)} ₺
                    </td>
                    <td className="p-4">
                      {p.is_active ? (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">Aktif</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">Pasif</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/magaza/duzenle/${p.id}`}
                          className="text-sm font-medium text-bordo hover:underline"
                        >
                          Düzenle
                        </Link>
                        <UrunSilButton productId={p.id} productName={p.name} />
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
