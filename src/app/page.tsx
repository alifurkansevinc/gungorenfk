import Link from "next/link";
import { AnadoluTemsilcisi } from "@/components/AnadoluTemsilcisi";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-bordo py-16 sm:py-24 text-beyaz">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            Güngören FK
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/90">
            Güngören Belediye Spor Kulübü resmi sitesi. Haberler, maçlar, kadro ve taraftar ailesi.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/taraftar/kayit"
              className="rounded-lg bg-beyaz px-6 py-3 font-semibold text-bordo hover:bg-white/95 transition-colors"
            >
              Taraftar Ol
            </Link>
            <Link
              href="/maclar"
              className="rounded-lg border-2 border-beyaz px-6 py-3 font-semibold text-beyaz hover:bg-white/10 transition-colors"
            >
              Maçlar
            </Link>
          </div>
        </div>
      </section>

      {/* Anadolu Temsilcisi - Progress bar 0-1000 */}
      <AnadoluTemsilcisi />

      {/* Kısa bilgi + CTA */}
      <section className="border-t border-black/10 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-siyah/80">
            Maçlar, kadro, haberler ve mağaza için menüyü kullanabilirsiniz. Giriş yapmadan siteyi gezebilirsiniz; progress bar sadece kayıtlı taraftarlarla ilerler.
          </p>
          <Link href="/taraftar/kayit" className="mt-6 inline-block rounded-lg bg-bordo px-6 py-3 font-medium text-beyaz hover:bg-bordo-dark transition-colors">
            Hemen Taraftar Ol
          </Link>
        </div>
      </section>
    </div>
  );
}
