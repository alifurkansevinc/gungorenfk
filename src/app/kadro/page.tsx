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
}: { name: string; shirt_number: number | null; position: string | null; photo_url: string | null; is_captain: boolean }) {
  return (
    <div className="card-hover rounded-xl border border-siyah/10 overflow-hidden bg-beyaz text-center">
      <div className="aspect-[3/4] relative bg-siyah/10">
        {photo_url ? (
          <Image src={photo_url} alt={name} fill className="object-cover" unoptimized />
        ) : (
          <Image src={DEMO_IMAGES.kadro} alt="" fill className="object-cover opacity-70" unoptimized />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-siyah/70 via-transparent to-transparent" />
        {shirt_number != null && (
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-bordo px-2.5 py-0.5 font-display text-lg font-bold text-beyaz">
            #{shirt_number}
          </span>
        )}
        {is_captain && (
          <span className="absolute top-2 right-2 rounded bg-bordo px-2 py-0.5 text-xs font-bold uppercase text-beyaz">
            Kaptan
          </span>
        )}
      </div>
      <div className="p-3">
        <h2 className="font-display font-semibold text-siyah">{name}</h2>
        {position && <p className="text-sm text-siyah/70">{position}</p>}
      </div>
    </div>
  );
}

export default async function KadroPage() {
  const squad = await getSquad();
  const { captains, byCategory } = groupSquadByCategory(squad);

  return (
    <div className="min-h-screen">
      <section className="relative h-[40vh] min-h-[280px] flex items-end bg-siyah">
        <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover opacity-80" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/60 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-6xl px-4 pb-10 pt-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-beyaz sm:text-4xl md:text-5xl">Kadro</h1>
          <p className="mt-2 text-beyaz/90">Takım kadromuz</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {captains.length > 0 && (
          <FadeInSection className="mb-14">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bordo mb-6">
              Kaptanlar
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            </div>
          </FadeInSection>
        )}

        {byCategory.map((cat) => (
          <FadeInSection key={cat.slug} className="mb-14">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bordo mb-6">
              {cat.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
            </div>
          </FadeInSection>
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
