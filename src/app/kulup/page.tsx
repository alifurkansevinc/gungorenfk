import Link from "next/link";
import { FadeInSection } from "@/components/FadeInSection";
import { TrophyGallery } from "@/components/TrophyGallery";
import { getClubAbout, getTrophies } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";
import type { ClubTrophy } from "@/types/db";

function toGalleryItem(t: ClubTrophy): { id: string; name: string; year: string | null; image_url: string | null; description: string | null } {
  return {
    id: t.id,
    name: t.name,
    year: t.year != null ? String(t.year) : null,
    image_url: t.image_url,
    description: t.description,
  };
}

export default async function KulupPage() {
  const [aboutContent, trophies] = await Promise.all([getClubAbout(), getTrophies()]);
  const galleryItems = trophies.map(toGalleryItem);

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
              <div className="mx-auto max-w-3xl">
                <div className="relative overflow-hidden rounded-2xl border border-beyaz/15 bg-gradient-to-b from-beyaz/5 to-beyaz/[0.02] px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-10 sm:py-10 md:px-12 md:py-12">
                  <span className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-bordo/50 to-transparent" aria-hidden />
                  <div className="whitespace-pre-line text-base leading-relaxed text-beyaz/95 sm:text-lg">
                    {aboutContent.trim()}
                  </div>
                  <span className="absolute bottom-0 left-1/2 h-px w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-beyaz/20 to-transparent" aria-hidden />
                </div>
              </div>
            ) : null}

            <h2 className={`font-display text-2xl font-bold text-beyaz sm:text-3xl ${aboutContent.trim() ? "mt-12" : ""}`}>
              Kupa Müzesi
            </h2>
            <p className="mt-2 text-beyaz/70">Kulübümüzün kazandığı kupalar; en yeniden eskiye. Tıklayarak hikayesini okuyabilirsiniz.</p>

            {trophies.length === 0 ? (
              <div className="mt-12 rounded-2xl border border-beyaz/10 bg-beyaz/5 py-16 text-center">
                <p className="text-beyaz/70">Henüz kupa eklenmemiş. Admin panelinden Kupa Müzesi bölümünden ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="mt-10">
                <TrophyGallery items={galleryItems} placeholderImage={DEMO_IMAGES.team} />
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
