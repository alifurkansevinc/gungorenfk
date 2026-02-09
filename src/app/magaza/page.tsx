import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Mağaza | Güngören FK",
  description: "Güngören FK resmi mağaza. Ödeme yok; ürünler ve fiyatlar bilgi amaçlı.",
};

export default async function MagazaPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("store_products")
    .select("id, name, slug, description, price, image_url")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Mağaza</h1>
      <p className="mt-2 text-siyah/70">Ürünler ve fiyatlar. Ödeme bu sitede alınmaz; bilgi amaçlıdır.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(!products || products.length === 0) ? (
          <p className="col-span-full text-siyah/60">Henüz ürün eklenmedi.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="rounded-xl border border-black/10 overflow-hidden bg-beyaz">
              {p.image_url ? (
                <div className="relative aspect-square">
                  <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="aspect-square bg-siyah/10 flex items-center justify-center text-siyah/40">Ürün görseli yok</div>
              )}
              <div className="p-4">
                <h2 className="font-semibold text-siyah">{p.name}</h2>
                {p.description && <p className="mt-1 text-sm text-siyah/70 line-clamp-2">{p.description}</p>}
                <p className="mt-2 font-bold text-bordo">{Number(p.price).toFixed(2)} ₺</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
