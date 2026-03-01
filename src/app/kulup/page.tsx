import Link from "next/link";
import Image from "next/image";
import { FadeInSection } from "@/components/FadeInSection";
import { getClubAbout, getTrophies } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";

export default async function KulupPage() {
  const [aboutContent, trophies] = await Promise.all([getClubAbout(), getTrophies()]);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Hero */}
      <section className="bg-siyah py-6 sm:py-8 text-beyaz">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Kulübümüz
          </h1>
        </div>
      </section>

      <FadeInSection>
        <section className="border-b border-siyah/10 bg-[#f8f8f8] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-2xl font-bold text-siyah">Kulüp yapısı</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Link
                href="/kulup/yonetim-kurulu"
                className="group flex items-center gap-4 rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm transition-all hover:border-bordo/30 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-bordo/10 text-bordo">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-siyah group-hover:text-bordo transition-colors">Yönetim Kurulu</h3>
                  <p className="mt-1 text-sm text-siyah/60">Kulüp yönetimi ve görevliler</p>
                </div>
                <span className="ml-auto text-bordo opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
              <Link
                href="#kupa-muzesi"
                className="group flex items-center gap-4 rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm transition-all hover:border-bordo/30 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-bordo/10 text-bordo">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 01-3-3m9 0v-3.375c0-.621.504-1.125 1.125-1.125h.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-siyah group-hover:text-bordo transition-colors">Hakkımızda & Tarihi ve Kupa Müzesi</h3>
                  <p className="mt-1 text-sm text-siyah/60">Kulüp tanıtımı ve kupalar</p>
                </div>
                <span className="ml-auto text-bordo opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
            </div>
          </div>
        </section>
      </FadeInSection>

      {/* Hakkımızda & Tarihi ve Kupa Müzesi */}
      <FadeInSection>
        <section id="kupa-muzesi" className="scroll-mt-8 border-b border-siyah/10 bg-siyah py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            {aboutContent.trim() ? (
              <div className="max-w-3xl">
                <h2 className="font-display text-2xl font-bold text-beyaz sm:text-3xl">Hakkımızda</h2>
                <div className="mt-4 whitespace-pre-line text-beyaz/90 leading-relaxed">
                  {aboutContent.trim()}
                </div>
              </div>
            ) : null}
            <h2 className={`font-display text-2xl font-bold text-beyaz sm:text-3xl ${aboutContent.trim() ? "mt-12" : ""}`}>
              Tarihi ve Kupa Müzesi
            </h2>
            <p className="mt-2 text-beyaz/70">Kulübümüzün kazandığı kupalar ve anılar.</p>
            {trophies.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-beyaz/10 bg-beyaz/5 py-16 text-center">
                <p className="text-beyaz/70">Henüz kupa eklenmemiş. Admin panelinden Kupa Müzesi bölümünden ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {trophies.map((t) => (
                  <article
                    key={t.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-beyaz/10 bg-gradient-to-b from-beyaz/10 to-transparent shadow-xl transition-all duration-300 hover:border-bordo/40 hover:shadow-[0_0_30px_rgba(139,21,56,0.2)]"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-siyah/30">
                      <Image
                        src={t.image_url || DEMO_IMAGES.team}
                        alt={t.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/20 to-transparent" />
                      <span className="absolute bottom-3 right-3 rounded-full bg-bordo px-3 py-1 text-sm font-bold text-beyaz shadow-lg">
                        {t.year}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg font-bold text-beyaz sm:text-xl">{t.name}</h3>
                      {t.description && (
                        <p className="mt-2 flex-1 text-sm leading-relaxed text-beyaz/80">{t.description}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <section className="bg-beyaz py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-sm text-siyah/60">Maçlar, kadro ve gelişmeler için</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link href="/maclar" className="rounded-full bg-bordo px-6 py-3 text-sm font-bold text-beyaz hover:bg-bordo-dark transition-colors">
                Maçlar
              </Link>
              <Link href="/kadro" className="rounded-full border-2 border-siyah/20 px-6 py-3 text-sm font-bold text-siyah hover:bg-siyah/5 transition-colors">
                Kadro
              </Link>
              <Link href="/haberler" className="rounded-full border-2 border-siyah/20 px-6 py-3 text-sm font-bold text-siyah hover:bg-siyah/5 transition-colors">
                Etkinlikler
              </Link>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
}
