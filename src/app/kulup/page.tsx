import Link from "next/link";
import Image from "next/image";
import { FadeInSection } from "@/components/FadeInSection";
import { getClubAbout, getTrophies } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";
import type { ClubTrophy } from "@/types/db";

const TROPHIES_PER_ROW = 3;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function TrophyCard({ t }: { t: ClubTrophy }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-beyaz/15 bg-gradient-to-b from-beyaz/10 to-transparent shadow-lg transition-all duration-300 hover:border-bordo/40 hover:shadow-[0_0_24px_rgba(139,21,56,0.25)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-siyah/30">
        <Image
          src={t.image_url || DEMO_IMAGES.team}
          alt={t.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/20 to-transparent" />
        <span className="absolute bottom-2 right-2 rounded-full bg-bordo px-2.5 py-0.5 text-xs font-bold text-beyaz shadow-lg">
          {t.year}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-display text-base font-bold text-beyaz sm:text-lg">{t.name}</h3>
        {t.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-beyaz/80">{t.description}</p>
        )}
      </div>
    </article>
  );
}

export default async function KulupPage() {
  const [aboutContent, trophies] = await Promise.all([getClubAbout(), getTrophies()]);
  const rows = chunk(trophies, TROPHIES_PER_ROW);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Hero */}
      <section className="bg-siyah py-6 sm:py-8 text-beyaz">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Tarihi
          </h1>
        </div>
      </section>

      {/* Hakkımızda + Kupa Müzesi (tek bölüm) */}
      <FadeInSection>
        <section id="kupa-muzesi" className="scroll-mt-8 border-b border-siyah/10 bg-siyah py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            {aboutContent.trim() ? (
              <div className="max-w-3xl">
                <div className="whitespace-pre-line text-beyaz/90 leading-relaxed">
                  {aboutContent.trim()}
                </div>
              </div>
            ) : null}

            <h2 className={`font-display text-2xl font-bold text-beyaz sm:text-3xl ${aboutContent.trim() ? "mt-12" : ""}`}>
              Kupa Müzesi
            </h2>
            <p className="mt-2 text-beyaz/70">Kulübümüzün kazandığı kupalar; en yeniden eskiye.</p>

            {trophies.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-beyaz/10 bg-beyaz/5 py-16 text-center">
                <p className="text-beyaz/70">Henüz kupa eklenmemiş. Admin panelinden Kupa Müzesi bölümünden ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="mt-10">
                {rows.map((rowTrophies, rowIndex) => (
                  <div key={rowIndex} className="relative">
                    {/* Satır: soldan sağa kupa kartları */}
                    <div className="flex flex-wrap justify-start gap-6 sm:gap-8">
                      {rowTrophies.map((t, i) => (
                        <div key={t.id} className="relative w-full min-w-0 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]" style={{ maxWidth: "320px" }}>
                          <TrophyCard t={t} />
                          {/* Kartlar arası timeline çizgisi (masaüstü, son kart hariç) */}
                          {i < rowTrophies.length - 1 && (
                            <span className="absolute -right-4 top-1/2 hidden h-0.5 w-8 bg-gradient-to-r from-beyaz/20 to-transparent lg:block" aria-hidden />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Aşağı ok: bir sonraki satıra geçiş */}
                    {rowIndex < rows.length - 1 && (
                      <div className="flex justify-center py-5 sm:py-6" aria-hidden>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="h-6 w-0.5 bg-beyaz/25" />
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-bordo/60 bg-bordo/20 text-beyaz shadow-lg">
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          </span>
                          <span className="h-6 w-0.5 bg-beyaz/25" />
                        </div>
                      </div>
                    )}
                  </div>
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
