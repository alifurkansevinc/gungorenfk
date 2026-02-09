import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { DEMO_IMAGES } from "@/lib/demo-images";

export const metadata = {
  title: "Mağaza | Güngören FK",
  description: "Güngören FK resmi mağaza. Forma, atkı, aksesuar ve tüm ürünler.",
};

export default async function MagazaPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("store_products")
    .select("id, name, slug, description, price, image_url")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div className="min-h-screen bg-siyah/5">
      {/* Üst band - e-ticaret tarzı */}
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="text-sm text-siyah/70">
            <Link href="/" className="hover:text-bordo">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-siyah font-medium">Mağaza</span>
          </nav>
          <h1 className="mt-4 text-2xl font-bold text-siyah sm:text-3xl">Mağaza</h1>
          <p className="mt-2 text-siyah/70">Resmi ürünler. Fiyatlar bilgi amaçlıdır; sipariş için kulüp ile iletişime geçin.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(!products || products.length === 0) ? (
            <>
              {["Resmi Forma", "Atkı", "Şapka", "Antrenman Forması"].map((name, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz">
                  <div className="relative aspect-square">
                    <Image src={DEMO_IMAGES.product} alt={name} fill className="object-cover" unoptimized />
                  </div>
                  <div className="p-4">
                    <h2 className="font-semibold text-siyah">{name}</h2>
                    <p className="mt-1 text-sm text-siyah/60">Ürünler admin panelinden eklenecektir.</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            products.map((p) => (
              <Link key={p.id} href={`/magaza/${p.slug}`} className="group block overflow-hidden rounded-xl border border-siyah/10 bg-beyaz transition-shadow hover:shadow-lg">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={p.image_url || DEMO_IMAGES.product}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    unoptimized
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-siyah group-hover:text-bordo transition-colors">{p.name}</h2>
                  {p.description && <p className="mt-1 text-sm text-siyah/70 line-clamp-2">{p.description}</p>}
                  <p className="mt-3 font-bold text-bordo">{Number(p.price).toFixed(2)} ₺</p>
                  <span className="mt-2 inline-block text-sm font-medium text-bordo">İncele →</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
