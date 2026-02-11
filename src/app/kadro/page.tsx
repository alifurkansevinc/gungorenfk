import { getSquad } from "@/lib/data";
import Image from "next/image";
import { FadeInSection } from "@/components/FadeInSection";
import { groupSquadByCategory } from "@/lib/squad-categories";
import { DEMO_IMAGES } from "@/lib/demo-images";

export const metadata = {
  title: "Kadro | Güngören FK",
  description: "Güngören FK kadrosu: kaptanlar, kaleci, bekler, stoperler, orta saha, kanatlar, hücumcular.",
};

function PlayerCard({
  name,
  shirt_number,
  position,
  photo_url,
  is_captain,
}: {
  name: string;
  shirt_number: number | null;
  position: string | null;
  photo_url: string | null;
  is_captain: boolean;
}) {
  return (
    <div className="group flex w-[140px] flex-shrink-0 snap-center flex-col rounded-xl border border-siyah/10 bg-beyaz overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:shadow-bordo/10 hover:border-bordo/30">
      <div className="relative aspect-square w-full overflow-hidden bg-siyah/10">
        {photo_url ? (
          <Image src={photo_url} alt={name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
        ) : (
          <Image src={DEMO_IMAGES.playerCard} alt="" fill className="object-cover opacity-85 transition-transform duration-300 group-hover:scale-105" unoptimized />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-siyah/60 via-transparent to-transparent opacity-80" />
        {shirt_number != null && (
          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-bordo px-2 py-0.5 font-display text-sm font-bold text-beyaz shadow-lg">
            #{shirt_number}
          </span>
        )}
        {is_captain && (
          <span className="absolute top-1.5 right-1.5 rounded bg-bordo px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-beyaz">
            Kaptan
          </span>
        )}
      </div>
      <div className="p-2.5 text-center">
        <h2 className="font-display text-sm font-semibold text-siyah leading-tight truncate" title={name}>
          {name}
        </h2>
        {position && <p className="mt-0.5 text-xs text-siyah/70 truncate" title={position}>{position}</p>}
      </div>
    </div>
  );
}

/** Yatay kaydırmalı oyuncu satırı: 3–4 kart görünür, fazlası slider ile */
function PlayerRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="overflow-x-auto overflow-y-hidden pb-3 scroll-smooth snap-x snap-mandatory" style={{ scrollbarWidth: "thin" }}>
        <div className="flex gap-4 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
      {/* Sağda gradient (daha fazla içerik var hissi) */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-[#f8f8f8] to-transparent" aria-hidden />
    </div>
  );
}

export default async function KadroPage() {
  const squad = await getSquad();
  const { captains, byCategory } = groupSquadByCategory(squad);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="relative h-[14vh] min-h-[100px] flex items-end bg-siyah">
        <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover opacity-80" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/60 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-6xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-2xl font-bold text-beyaz sm:text-3xl">Kadro</h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {captains.length > 0 && (
          <>
            <FadeInSection className="pb-8">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-bordo mb-4">
                Kaptanlar
              </h2>
              <PlayerRow>
                {captains.map((p) => (
                  <PlayerCard
                    key={p.id}
                    name={p.name}
                    shirt_number={p.shirt_number}
                    position={p.position}
                    photo_url={p.photo_url}
                    is_captain={true}
                  />
                ))}
              </PlayerRow>
            </FadeInSection>
            <div className="border-t border-siyah/15 py-6" aria-hidden />
          </>
        )}

        {byCategory.map((cat, idx) => (
          <div key={cat.slug}>
            <FadeInSection className="pb-8">
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-bordo mb-4">
                {cat.label}
              </h2>
              <PlayerRow>
                {cat.players.map((p) => (
                  <PlayerCard
                    key={p.id}
                    name={p.name}
                    shirt_number={p.shirt_number}
                    position={p.position}
                    photo_url={p.photo_url}
                    is_captain={false}
                  />
                ))}
              </PlayerRow>
            </FadeInSection>
            {idx < byCategory.length - 1 && (
              <div className="border-t border-siyah/15 py-6" aria-hidden />
            )}
          </div>
        ))}

        {squad.length === 0 && (
          <FadeInSection>
            <p className="text-siyah/60 py-12 text-center">Henüz oyuncu eklenmedi.</p>
          </FadeInSection>
        )}
      </div>
    </div>
  );
}
