import Link from "next/link";
import Image from "next/image";
import { getProductBySlug, getFeaturedProducts } from "@/lib/data";
import { notFound } from "next/navigation";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductImageGallery } from "@/components/ProductImageGallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Ürün | Güngören FK" };
  return { title: `${product.name} | Güngören FK Mağaza`, description: product.description || undefined };
}

export default async function UrunDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = Array.isArray((product as { images?: string[] }).images) && (product as { images?: string[] }).images?.length
    ? (product as { images: string[] }).images
    : [product.image_url || DEMO_IMAGES.product];
  const mainImage = images[0];
  const price = Number(product.price).toFixed(2);
  const allProducts = await getFeaturedProducts(20);
  const related = allProducts.filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Üst band */}
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-siyah/70">
            <Link href="/" className="hover:text-bordo transition-colors">Anasayfa</Link>
            <span className="mx-2">/</span>
            <Link href="/magaza" className="hover:text-bordo transition-colors">Mağaza</Link>
            <span className="mx-2">/</span>
            <span className="text-siyah font-medium truncate max-w-[200px] inline-block" title={product.name}>{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Ana içerik — ürün profil sayfası (GS Store / spor kulübü mağazası tarzı) */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:gap-12 lg:grid-cols-2">
          {/* Görsel alanı — çoklu görsel */}
          <div className="space-y-4">
            <ProductImageGallery images={images} productName={product.name} />
            {(product as { sku?: string }).sku && (
              <p className="text-center text-xs text-siyah/50">Stok kodu: {(product as { sku: string }).sku}</p>
            )}
          </div>

          {/* Bilgi alanı */}
          <div>
            <h1 className="font-display text-2xl font-bold text-siyah sm:text-3xl lg:text-4xl">{product.name}</h1>
            <p className="mt-4 text-3xl font-bold text-bordo">{price} ₺</p>
            <p className="mt-2 text-sm text-siyah/60">KDV dahil. iyzico ile güvenli ödeme.</p>

            {product.description && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/70">Ürün bilgisi</h2>
                <p className="mt-2 text-siyah/80 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={Number(product.price)}
              slug={product.slug}
            />
          </div>
        </div>

        {/* Benzer / diğer ürünler */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-siyah/10">
            <h2 className="font-display text-xl font-bold text-siyah">Diğer ürünler</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/magaza/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={p.image_url || DEMO_IMAGES.product}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="25vw"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-siyah line-clamp-2 group-hover:text-bordo transition-colors">{p.name}</h3>
                    <p className="mt-1 font-bold text-bordo">{Number(p.price).toFixed(2)} ₺</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
