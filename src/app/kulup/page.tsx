import Link from "next/link";
import { FadeInSection } from "@/components/FadeInSection";
import { MilestoneTimeline } from "@/components/MilestoneTimeline";
import { getClubAbout, getTrophies } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";
import type { ClubTrophy } from "@/types/db";

function toMilestoneItem(t: ClubTrophy): { id: string; name: string; year: string | null; image_url: string | null; description: string | null } {
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
  const milestoneItems = trophies.map(toMilestoneItem);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Hero */}
      <section className="bg-siyah py-8 sm:py-10 text-beyaz">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Kupalarımız
          </h1>
          <p className="mt-2 text-beyaz/70 text-sm sm:text-base">
            Kazandığımız kupalar ve hikayeleri. Bir kupa seçin, hikayesini okuyun.
          </p>
        </div>
      </section>

      {/* Milestone diyagramı — yıl + kupa, akışkan; altta dinamik hikaye alanı */}
      <FadeInSection>
        <section id="kupa-muzesi" className="scroll-mt-8 border-b border-siyah/10 bg-siyah py-10 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            {milestoneItems.length === 0 ? (
              <div className="rounded-2xl border border-beyaz/10 bg-beyaz/5 py-16 text-center">
                <p className="text-beyaz/70">Henüz kupa eklenmemiş. Admin panelinden Kupa Müzesi bölümünden ekleyebilirsiniz.</p>
              </div>
            ) : (
              <MilestoneTimeline items={milestoneItems} placeholderImage={DEMO_IMAGES.team} />
            )}
          </div>
        </section>
      </FadeInSection>

      {/* Tarihi — sayfanın altında, hakkımızda metni */}
      {aboutContent.trim() ? (
        <FadeInSection>
          <section className="border-b border-siyah/10 bg-gradient-to-b from-siyah to-siyah/95 py-14 sm:py-20">
            <div className="mx-auto max-w-3xl px-6">
              <div className="relative overflow-hidden rounded-2xl border border-beyaz/15 bg-gradient-to-b from-beyaz/5 to-beyaz/[0.02] px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-10 sm:py-10">
                <span className="absolute left-1/2 top-0 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-bordo/50 to-transparent" aria-hidden />
                <div className="whitespace-pre-line text-base leading-relaxed text-beyaz/95 sm:text-lg">
                  {aboutContent.trim()}
                </div>
                <span className="absolute bottom-0 left-1/2 h-px w-16 -translate-x-1/2 bg-gradient-to-r from-transparent via-beyaz/20 to-transparent" aria-hidden />
              </div>
            </div>
          </section>
        </FadeInSection>
      ) : null}

      {/* CTA */}
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
