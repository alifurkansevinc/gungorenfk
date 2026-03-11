import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedProducts, getStoreDiscountForLevel, getEffectiveProductPrice, getMemberProductDiscountsForUser } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";

export const metadata = {
  title: "Mağaza | Güngören FK",
  description: "Güngören FK resmi mağaza. Forma, atkı, aksesuar ve tüm ürünler. Üye indirimi uygulanır.",
};

export default async function MagazaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let levelDiscountPercent = 0;
  let memberDiscounts: Record<string, number> = {};
  if (user) {
    const { data: profile } = await supabase.from("fan_profiles").select("fan_level_id").eq("user_id", user.id).single();
    const levelId = (profile as { fan_level_id?: number } | null)?.fan_level_id ?? 1;
    [levelDiscountPercent, memberDiscounts] = await Promise.all([
      getStoreDiscountForLevel(levelId),
      getMemberProductDiscountsForUser(user.id),
    ]);
  }

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
          {levelDiscountPercent > 0 && (
            <p className="mt-2 rounded-lg bg-bordo/10 px-3 py-1.5 text-sm font-medium text-bordo inline-block">
              Üye indiriminiz: %{levelDiscountPercent} — Ürün bazlı indirimler de uygulanır
            </p>
          )}
        </div>
      </div>

      {/* Ürün grid — üyelik indirimi gösterimi */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const listPrice = Number(p.price);
            const productDiscount = Math.max(levelDiscountPercent, memberDiscounts[p.id] ?? 0);
            const effectivePrice = getEffectiveProductPrice(listPrice, productDiscount);
            const hasDiscount = productDiscount > 0 && effectivePrice < listPrice;
            return (
              <Link
                key={p.id}
                href={p.slug ? `/magaza/${p.slug}` : "/magaza"}
                className="group flex flex-col overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-bordo/20"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-siyah/5">
                  <Image
                    src={p.image_url || DEMO_IMAGES.product}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    unoptimized
                  />
                  {hasDiscount && (
                    <span className="absolute top-2 right-2 rounded-full bg-bordo px-2 py-0.5 text-xs font-bold text-beyaz">%{productDiscount} indirim</span>
                  )}
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
                    <div className="flex flex-wrap items-baseline gap-2">
                      {hasDiscount ? (
                        <>
                          <span className="text-sm text-siyah/50 line-through">{listPrice.toFixed(2)} ₺</span>
                          <span className="text-xl font-bold text-bordo">{effectivePrice.toFixed(2)} ₺</span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-bordo">{listPrice.toFixed(2)} ₺</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-bordo opacity-0 group-hover:opacity-100 transition-opacity">
                      İncele →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
