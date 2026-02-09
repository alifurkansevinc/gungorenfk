import { createClient } from "@/lib/supabase/server";

export default async function AdminMagazaPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("store_products").select("id, name, price, is_active").order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Mağaza Ürünleri</h1>
      <p className="mt-1 text-siyah/70">Ürün ekle/düzenle. Ödeme alınmaz; sadece fiyat ve ürün bilgisi.</p>
      <div className="mt-6 space-y-2">
        {(!products || products.length === 0) ? (
          <p className="text-siyah/60">Henüz ürün yok.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded border border-black/10 bg-beyaz px-4 py-3">
              <span className="font-medium">{p.name}</span>
              <span className="text-bordo font-semibold">{Number(p.price).toFixed(2)} ₺</span>
            </div>
          ))
        )}
      </div>
      <p className="mt-6 text-sm text-siyah/60">CRUD formu sonraki adımda eklenecek.</p>
    </div>
  );
}
