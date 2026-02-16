import Link from "next/link";
import Image from "next/image";
import { AnadoluTemsilcisi } from "@/components/AnadoluTemsilcisi";
import { TaraftarBarStrip } from "@/components/TaraftarBarStrip";
import { FadeInSection } from "@/components/FadeInSection";
import { DEMO_IMAGES } from "@/lib/demo-images";

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center bg-siyah text-beyaz overflow-hidden">
        <Image
          src={DEMO_IMAGES.hero}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-siyah/75 via-siyah/50 to-siyah/85" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.4em] text-beyaz/80 animate-fade-in-up">
            Güngören Belediye Spor Kulübü
          </p>
          <h1 className="font-display mt-5 text-5xl font-bold tracking-tight drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl animate-fade-in-up animate-delay-100">
            Güngören FK
          </h1>
          <p className="mt-6 max-w-md mx-auto text-lg text-beyaz/90 font-light animate-fade-in-up animate-delay-200">
            Güngören&apos;in takımı. Maçlar, gelişmeler ve taraftar ailesi.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up animate-delay-400">
            <Link
              href="/taraftar/kayit"
              className="inline-flex items-center rounded-full bg-beyaz px-8 py-4 text-sm font-bold text-bordo shadow-xl transition-all duration-300 hover:bg-white hover:scale-105 btn-glow"
            >
              Taraftar Ol
            </Link>
            <Link
              href="/maclar"
              className="inline-flex items-center rounded-full border-2 border-beyaz px-8 py-4 text-sm font-bold text-beyaz transition-all duration-300 hover:bg-beyaz/15 hover:scale-105"
            >
              Maçlar
            </Link>
          </div>
        </div>
      </section>

      {/* Taraftar sayacı — hero'dan hemen sonra, her zaman görünsün */}
      <TaraftarBarStrip />

      {/* Taraftar bar (1000 Taraftar 1 Bayrak) — detaylı bölüm */}
      <AnadoluTemsilcisi />

      {/* Öne çıkan kartlar */}
      <FadeInSection>
      <section className="py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-siyah/50">Öne çıkan</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/magaza"
              className="group relative overflow-hidden rounded-2xl bg-siyah shadow-xl card-hover lg:col-span-2 lg:row-span-2 min-h-[280px]"
            >
              <Image
                src={DEMO_IMAGES.product}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/95 via-siyah/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-bordo">Mağaza</span>
                <span className="font-display mt-2 text-xl font-bold text-beyaz sm:text-2xl">Resmi ürünler</span>
                <span className="mt-1 text-sm text-beyaz/80">Forma, atkı, aksesuar →</span>
              </div>
            </Link>
            <Link href="/bagis" className="group relative overflow-hidden rounded-2xl bg-siyah shadow-lg card-hover min-h-[180px]">
              <Image src={DEMO_IMAGES.news} alt="" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" sizes="25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/90 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-beyaz/70">Bağış Yap</span>
                <span className="font-display mt-1 text-lg font-bold text-beyaz">Destek ol →</span>
              </div>
            </Link>
            <Link href="/kadro" className="group relative overflow-hidden rounded-2xl bg-siyah shadow-lg card-hover min-h-[180px]">
              <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" sizes="25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/90 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-beyaz/70">Kadro</span>
                <span className="font-display mt-1 text-lg font-bold text-beyaz">Takım →</span>
              </div>
            </Link>
            <Link href="/biletler" className="group relative overflow-hidden rounded-2xl bg-bordo shadow-lg card-hover min-h-[180px]">
              <Image src={DEMO_IMAGES.taraftar} alt="" fill className="object-cover opacity-40 transition-transform duration-700 ease-out group-hover:scale-110" sizes="25vw" />
              <div className="absolute inset-0 bg-bordo/80" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-beyaz/90">Maç Biletleri</span>
                <span className="font-display mt-1 text-lg font-bold text-beyaz">Bilet al →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>
    </div>
  );
}
