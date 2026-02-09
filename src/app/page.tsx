import Link from "next/link";
import Image from "next/image";
import { getMatches, getLatestNews, getFeaturedProducts } from "@/lib/data";
import { AnadoluTemsilcisi } from "@/components/AnadoluTemsilcisi";

export default async function Home() {
  const [matches, news, products] = await Promise.all([
    getMatches(6),
    getLatestNews(4),
    getFeaturedProducts(4),
  ]);
  const nextMatch = matches.find((m) => m.status === "scheduled") ?? matches[0];
  const recentMatches = matches.filter((m) => m.status === "finished").slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero - Juventus tarzı tam genişlik */}
      <section className="relative bg-siyah text-beyaz">
        <div className="absolute inset-0 bg-gradient-to-b from-bordo/40 to-siyah" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-beyaz/80">Güngören Belediye Spor Kulübü</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Güngören FK
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/85">
            Güngören&apos;in takımı. Haberler, maçlar, kadro ve taraftar ailesi.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/taraftar/kayit" className="inline-flex items-center rounded bg-beyaz px-6 py-3 text-sm font-semibold text-bordo hover:bg-white/95 transition-colors">
              Taraftar Ol
            </Link>
            <Link href="/maclar" className="inline-flex items-center rounded border-2 border-beyaz px-6 py-3 text-sm font-semibold text-beyaz hover:bg-white/10 transition-colors">
              Maçlar
            </Link>
          </div>
        </div>
      </section>

      {/* Öne çıkan içerik - Top Content kartları */}
      <section className="border-b border-siyah/10 bg-beyaz py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold tracking-tight text-siyah sm:text-2xl">Öne çıkan</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link href={nextMatch ? `/maclar/${nextMatch.id}` : "/maclar"} className="group relative overflow-hidden rounded-lg bg-siyah aspect-[4/3]">
              <div className="absolute inset-0 bg-bordo/90 p-4 flex flex-col justify-end">
                <span className="text-xs font-medium uppercase text-beyaz/80">Sonraki maç</span>
                <span className="mt-1 font-semibold text-beyaz group-hover:underline">
                  {nextMatch ? nextMatch.opponent_name : "Maçlar"}
                </span>
                {nextMatch?.match_date && <span className="mt-0.5 text-sm text-beyaz/80">{new Date(nextMatch.match_date).toLocaleDateString("tr-TR")}</span>}
              </div>
            </Link>
            <Link href="/haberler" className="group relative overflow-hidden rounded-lg bg-siyah aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/95 to-transparent p-4 flex flex-col justify-end">
                <span className="text-xs font-medium uppercase text-beyaz/80">Haberler</span>
                <span className="mt-1 font-semibold text-beyaz group-hover:underline">Tüm haberler</span>
              </div>
            </Link>
            <Link href="/galeri" className="group relative overflow-hidden rounded-lg bg-siyah aspect-[4/3]">
              <div className="absolute inset-0 bg-gradient-to-t from-siyah/95 to-transparent p-4 flex flex-col justify-end">
                <span className="text-xs font-medium uppercase text-beyaz/80">Galeri</span>
                <span className="mt-1 font-semibold text-beyaz group-hover:underline">Fotoğraflar</span>
              </div>
            </Link>
            <Link href="/taraftar/kayit" className="group relative overflow-hidden rounded-lg bg-bordo aspect-[4/3]">
              <div className="absolute inset-0 p-4 flex flex-col justify-end">
                <span className="text-xs font-medium uppercase text-beyaz/90">Taraftar</span>
                <span className="mt-1 font-semibold text-beyaz group-hover:underline">Resmi taraftar ol</span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Maçlar ve sonuçlar - Fixtures */}
      <section className="border-b border-siyah/10 bg-siyah/5 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-siyah sm:text-2xl">Maçlar ve sonuçlar</h2>
            <Link href="/maclar" className="text-sm font-semibold text-bordo hover:underline">Tüm maçlar</Link>
          </div>
          <div className="mt-6 space-y-3">
            {recentMatches.length > 0 ? recentMatches.map((m) => (
              <Link key={m.id} href={`/maclar/${m.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-siyah/10 bg-beyaz px-4 py-3 hover:border-bordo/30 transition-colors">
                <span className="font-medium text-siyah">{m.opponent_name}</span>
                <span className="text-sm text-siyah/70">{new Date(m.match_date).toLocaleDateString("tr-TR")} · {m.home_away === "home" ? "İç saha" : "Deplasman"}</span>
                {m.goals_for != null && m.goals_against != null && (
                  <span className="font-bold text-bordo">Güngören FK {m.goals_for} - {m.goals_against}</span>
                )}
              </Link>
            )) : (
              <p className="text-siyah/60">Henüz maç sonucu yok.</p>
            )}
          </div>
        </div>
      </section>

      {/* Anadolu Temsilcisi - 1000 Taraftar 1 Bayrak */}
      <AnadoluTemsilcisi />

      {/* Haberler - Latest News */}
      {news.length > 0 && (
        <section className="border-b border-siyah/10 bg-beyaz py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-siyah sm:text-2xl">Haberler</h2>
              <Link href="/haberler" className="text-sm font-semibold text-bordo hover:underline">Tüm haberler</Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {news.map((n) => (
                <Link key={n.id} href={`/haberler/${n.slug}`} className="group block overflow-hidden rounded-lg border border-siyah/10 bg-beyaz transition-shadow hover:shadow-lg">
                  {n.image_url ? (
                    <div className="relative aspect-video overflow-hidden">
                      <Image src={n.image_url} alt="" fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                    </div>
                  ) : (
                    <div className="aspect-video bg-siyah/10 flex items-center justify-center text-bordo font-bold">GFK</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-siyah group-hover:text-bordo transition-colors line-clamp-2">{n.title}</h3>
                    {n.published_at && <p className="mt-1 text-xs text-siyah/60">{new Date(n.published_at).toLocaleDateString("tr-TR")}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mağaza öne çıkan - Shop */}
      {products.length > 0 && (
        <section className="border-b border-siyah/10 bg-siyah/5 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-siyah sm:text-2xl">Mağaza</h2>
              <Link href="/magaza" className="text-sm font-semibold text-bordo hover:underline">Mağazaya git</Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <Link key={p.id} href="/magaza" className="group block overflow-hidden rounded-lg border border-siyah/10 bg-beyaz transition-shadow hover:shadow-lg">
                  {p.image_url ? (
                    <div className="relative aspect-square">
                      <Image src={p.image_url} alt={p.name} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                    </div>
                  ) : (
                    <div className="aspect-square bg-siyah/10 flex items-center justify-center text-bordo font-bold">GFK</div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-siyah group-hover:text-bordo transition-colors">{p.name}</h3>
                    <p className="mt-1 font-bold text-bordo">{Number(p.price).toFixed(2)} ₺</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Taraftar CTA + Bülten */}
      <section className="bg-bordo text-beyaz py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold sm:text-2xl">Resmi taraftar ol</h2>
          <p className="mt-2 max-w-xl mx-auto text-white/90">
            Ailemize katıl, rozetini kazan. Maçlara gelerek ve mağazadan alışveriş yaparak kademe atla.
          </p>
          <Link href="/taraftar/kayit" className="mt-6 inline-block rounded bg-beyaz px-6 py-3 font-semibold text-bordo hover:bg-white/95 transition-colors">
            Hemen kayıt ol
          </Link>
        </div>
      </section>
    </div>
  );
}
