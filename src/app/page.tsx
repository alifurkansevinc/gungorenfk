import Link from "next/link";
import Image from "next/image";
import { getMatches, getLatestNews, getFeaturedProducts } from "@/lib/data";
import { AnadoluTemsilcisi } from "@/components/AnadoluTemsilcisi";
import { TaraftarBarStrip } from "@/components/TaraftarBarStrip";
import { FadeInSection } from "@/components/FadeInSection";
import { DEMO_IMAGES } from "@/lib/demo-images";

export default async function Home() {
  const [matches, news, products] = await Promise.all([
    getMatches(6),
    getLatestNews(4),
    getFeaturedProducts(4),
  ]);
  const nextMatch = matches.find((m) => m.status === "scheduled") ?? matches[0];
  const recentMatches = matches.filter((m) => m.status === "finished").slice(0, 3);
  const displayProducts = products.length > 0 ? products : [
    { id: "d1", name: "Resmi Forma", slug: "", price: "349", image_url: null },
    { id: "d2", name: "Atkı", slug: "", price: "79", image_url: null },
    { id: "d3", name: "Şapka", slug: "", price: "59", image_url: null },
    { id: "d4", name: "Antrenman Forması", slug: "", price: "199", image_url: null },
  ];

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

      {/* Kulüp — anasayfa önceliği: maçlardan önce kulüp tanıtımı */}
      <FadeInSection>
        <section className="border-y border-siyah/10 bg-beyaz py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-siyah/50">Kulüp</p>
            <h2 className="font-display mt-1 text-2xl font-bold text-siyah">Güngören Belediye Spor Kulübü</h2>
            <p className="mt-4 max-w-2xl text-siyah/80">
              İstanbul Güngören&apos;in resmi futbol kulübü. Bölgesel Amatör Lig&apos;de mücadele ediyoruz; 
              taraftar ailesi ve bölge sporuna güç katıyoruz.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Link href="/kulup" className="inline-flex rounded-full bg-bordo px-6 py-3 text-sm font-bold text-beyaz hover:bg-bordo-dark transition-colors">
                Kulüp sayfası
              </Link>
              <Link href="/kulup/yonetim-kurulu" className="inline-flex rounded-full border-2 border-siyah/20 px-6 py-3 text-sm font-bold text-siyah hover:bg-siyah/5 transition-colors">
                Yönetim Kurulu
              </Link>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Taraftar bar (1000 Taraftar 1 Bayrak) — detaylı bölüm */}
      <AnadoluTemsilcisi />

      {/* Öne çıkan kartlar */}
      <FadeInSection>
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-siyah/50">Öne çıkan</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href={nextMatch ? `/maclar/${nextMatch.id}` : "/maclar"}
              className="group relative overflow-hidden rounded-2xl bg-siyah shadow-xl card-hover lg:col-span-2 lg:row-span-2 min-h-[280px]"
            >
              <Image
                src={DEMO_IMAGES.match}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/95 via-siyah/40 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
                <span className="text-xs font-semibold uppercase tracking-wider text-bordo">Sonraki maç</span>
                <span className="font-display mt-2 text-xl font-bold text-beyaz sm:text-2xl">
                  {nextMatch ? nextMatch.opponent_name : "Maçlar"}
                </span>
                {nextMatch?.match_date && (
                  <span className="mt-1 text-sm text-beyaz/80">{new Date(nextMatch.match_date).toLocaleDateString("tr-TR")}</span>
                )}
              </div>
            </Link>
            <Link href="/haberler" className="group relative overflow-hidden rounded-2xl bg-siyah shadow-lg card-hover min-h-[180px]">
              <Image src={DEMO_IMAGES.news} alt="" fill className="object-cover transition-transform duration-700 ease-out group-hover:scale-110" sizes="25vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/90 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-beyaz/70">Gelişmeler</span>
                <span className="font-display mt-1 text-lg font-bold text-beyaz">Tümü →</span>
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
            <Link href="/taraftar/kayit" className="group relative overflow-hidden rounded-2xl bg-bordo shadow-lg card-hover min-h-[180px]">
              <Image src={DEMO_IMAGES.taraftar} alt="" fill className="object-cover opacity-40 transition-transform duration-700 ease-out group-hover:scale-110" sizes="25vw" />
              <div className="absolute inset-0 bg-bordo/80" />
              <div className="absolute inset-0 flex flex-col justify-end p-5">
                <span className="text-xs font-semibold uppercase tracking-wider text-beyaz/90">Taraftar</span>
                <span className="font-display mt-1 text-lg font-bold text-beyaz">Resmi taraftar ol →</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
      </FadeInSection>

      <FadeInSection>
      <section className="border-y border-siyah/10 bg-beyaz py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-siyah/50">Fikstür</p>
              <h2 className="font-display mt-1 text-2xl font-bold text-siyah">Maçlar ve sonuçlar</h2>
            </div>
            <Link href="/maclar" className="text-sm font-bold text-bordo hover:underline">Tüm maçlar →</Link>
          </div>
          <div className="relative mt-8 h-44 overflow-hidden rounded-2xl sm:h-52 shadow-lg">
            <Image src={DEMO_IMAGES.stadium} alt="" fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-siyah/60 flex items-center justify-center">
              <span className="font-display text-beyaz text-lg font-semibold tracking-wide">Güngören Stadyumu</span>
            </div>
          </div>
          <div className="mt-6 divide-y divide-siyah/10 overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm">
            {recentMatches.length > 0 ? (
              recentMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/maclar/${m.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-all duration-200 hover:bg-bordo/5 hover:pl-6"
                >
                  <span className="font-semibold text-siyah">{m.opponent_name}</span>
                  <span className="text-sm text-siyah/60">
                    {new Date(m.match_date).toLocaleDateString("tr-TR")} · {m.home_away === "home" ? "İç saha" : "Deplasman"}
                  </span>
                  {m.goals_for != null && m.goals_against != null && (
                    <span className="text-lg font-bold text-bordo">Güngören FK {m.goals_for} – {m.goals_against}</span>
                  )}
                </Link>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-siyah/50">Henüz maç sonucu yok.</p>
            )}
          </div>
        </div>
      </section>
      </FadeInSection>

      {news.length > 0 && (
        <FadeInSection>
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-siyah/50">İçerik</p>
                <h2 className="font-display mt-1 text-2xl font-bold text-siyah">Gelişmeler</h2>
              </div>
              <Link href="/haberler" className="text-sm font-bold text-bordo hover:underline">Tümü →</Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {news.map((n) => (
                <Link
                  key={n.id}
                  href={`/haberler/${n.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm card-hover"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={n.image_url || DEMO_IMAGES.news}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-siyah line-clamp-2 group-hover:text-bordo transition-colors">{n.title}</h3>
                    {n.published_at && (
                      <p className="mt-2 text-xs text-siyah/50">{new Date(n.published_at).toLocaleDateString("tr-TR")}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
        </FadeInSection>
      )}

      {/* Mağaza */}
      <FadeInSection>
      <section className="border-t border-siyah/10 bg-beyaz py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-siyah/50">Resmi ürünler</p>
              <h2 className="font-display mt-1 text-2xl font-bold text-siyah">Mağaza</h2>
            </div>
            <Link href="/magaza" className="text-sm font-bold text-bordo hover:underline">Mağazaya git →</Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayProducts.map((p) => (
              <Link
                key={p.id}
                href={p.slug ? `/magaza/${p.slug}` : "/magaza"}
                className="group block overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm card-hover"
              >
                <div className="relative aspect-square overflow-hidden bg-siyah/5">
                  <Image
                    src={p.image_url || DEMO_IMAGES.product}
                    alt={p.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-siyah group-hover:text-bordo transition-colors">{p.name}</h3>
                  <p className="mt-2 font-bold text-bordo">{Number(p.price).toFixed(2)} ₺</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      </FadeInSection>

      {/* CTA */}
      <FadeInSection>
      <section className="relative overflow-hidden bg-bordo py-16 sm:py-20 text-beyaz">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_white_1px,_transparent_1px)] bg-[size:24px_24px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Resmi taraftar ol</h2>
          <p className="mt-3 text-beyaz/90">Ailemize katıl, rozetini kazan. Maçlara gelerek ve mağazadan alışveriş yaparak kademe atla.</p>
          <Link
            href="/taraftar/kayit"
            className="mt-8 inline-flex rounded-full bg-beyaz px-8 py-4 text-sm font-bold text-bordo shadow-lg transition-all duration-300 hover:bg-white hover:scale-105 btn-glow"
          >
            Hemen kayıt ol
          </Link>
        </div>
      </section>
      </FadeInSection>
    </div>
  );
}
