import Link from "next/link";
import Image from "next/image";
import { getProductBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import { DEMO_IMAGES } from "@/lib/demo-images";

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

  const imageUrl = product.image_url || DEMO_IMAGES.product;

  return (
    <div className="min-h-screen bg-siyah/5">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-siyah/70 mb-8">
          <Link href="/magaza" className="hover:text-bordo">Mağaza</Link>
          <span className="mx-2">/</span>
          <span className="text-siyah">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Görsel */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz">
            <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized priority />
          </div>

          {/* Bilgi */}
          <div>
            <h1 className="text-2xl font-bold text-siyah sm:text-3xl">{product.name}</h1>
            <p className="mt-4 text-3xl font-bold text-bordo">{Number(product.price).toFixed(2)} ₺</p>
            {product.description && <p className="mt-6 text-siyah/80 leading-relaxed">{product.description}</p>}
            <div className="mt-8 rounded-xl border border-siyah/10 bg-beyaz/80 p-4">
              <p className="text-sm text-siyah/70">Ödeme bu sitede alınmaz. Sipariş ve bilgi için kulüp ile iletişime geçin.</p>
            </div>
            <Link href="/magaza" className="mt-8 inline-block rounded-lg bg-bordo px-6 py-3 font-semibold text-beyaz hover:bg-bordo-dark transition-colors">
              ← Mağazaya dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
