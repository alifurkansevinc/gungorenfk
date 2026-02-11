import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedProducts } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";

export const metadata = {
  title: "Mağaza | Güngören FK",
  description: "Güngören FK resmi mağaza. Forma, atkı, aksesuar ve tüm ürünler.",
};

export default async function MagazaPage() {
  const products = await getFeaturedProducts(50);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Üst band — e-ticaret tarzı */}
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <nav className="text-sm text-siyah/70">
            <Link href="/" className="hover:text-bordo transition-colors">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-siyah font-medium">Mağaza</span>
          </nav>
          <h1 className="font-display mt-3 text-2xl font-bold text-siyah sm:text-3xl">Mağaza</h1>
        </div>
      </div>

      {/* Ürün grid — Apeirona / e-ticaret kart mantığı */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <Link
              key={p.id}
              href={p.slug ? `/magaza/${p.slug}` : "/magaza"}
              className="group flex flex-col overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-bordo/20"
            >
              <div className="relative aspect-square overflow-hidden bg-siyah/5">
                <Image
                  src={p.image_url || DEMO_IMAGES.product}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-siyah/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="font-display font-semibold text-siyah group-hover:text-bordo transition-colors line-clamp-2">
                  {p.name}
                </h2>
                {p.description && (
                  <p className="mt-2 text-sm text-siyah/60 line-clamp-2 flex-1">{p.description}</p>
                )}
                <div className="mt-4 flex items-end justify-between gap-2">
                  <span className="text-xl font-bold text-bordo">{Number(p.price).toFixed(2)} ₺</span>
                  <span className="text-sm font-medium text-bordo opacity-0 group-hover:opacity-100 transition-opacity">
                    İncele →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
