import Link from "next/link";
import Image from "next/image";
import { getTechnicalStaff } from "@/lib/data";
import { TECHNICAL_STAFF_ROLE_LABELS } from "@/lib/board-labels";
import { FadeInSection } from "@/components/FadeInSection";
import { PersonCard } from "@/components/PersonCard";
import { PersonCardSlider } from "@/components/PersonCardSlider";
import type { TechnicalStaffMember } from "@/types/db";
import { DEMO_IMAGES } from "@/lib/demo-images";

const ROLE_ORDER = [
  "teknik_direktor",
  "yardimci_hoca",
  "kaleci_antrenoru",
  "altyapi_td",
  "gelisim_direktoru",
  "futbol_direktoru",
  "kulup_muduru",
  "lojistik_muduru",
  "fizyoterapist",
] as const;

function groupByRole(members: TechnicalStaffMember[]) {
  const map = new Map<string, TechnicalStaffMember[]>();
  for (const r of ROLE_ORDER) map.set(r, []);
  for (const m of members) {
    const list = map.get(m.role_slug);
    if (list) list.push(m);
    else map.set(m.role_slug, [m]);
  }
  return ROLE_ORDER.map((slug) => ({
    slug,
    label: TECHNICAL_STAFF_ROLE_LABELS[slug] ?? slug,
    list: map.get(slug) ?? [],
  })).filter((g) => g.list.length > 0);
}

export const metadata = {
  title: "Teknik Heyet | Güngören FK",
  description: "Güngören FK teknik direktör, antrenörler ve kulüp yönetimi.",
};

export default async function TeknikHeyetPage() {
  const members = await getTechnicalStaff();
  const groups = groupByRole(members);

  return (
    <div className="min-h-screen bg-siyah">
      <section className="relative border-b border-beyaz/10 bg-siyah py-8 sm:py-10 text-beyaz overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-siyah/80 to-siyah" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/kulup" className="text-sm font-medium text-beyaz/70 hover:text-beyaz transition-colors">
            ← Kulüp
          </Link>
          <p className="font-display mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-bordo">
            Kulüp
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Teknik Heyet
          </h1>
          <p className="mt-2 text-sm text-beyaz/80 max-w-2xl">
            Teknik direktör, antrenörler, futbol direktörü ve kulüp yönetimi.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {groups.map((group) => (
          <FadeInSection key={group.slug} className="mb-12 sm:mb-16">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-bordo mb-5">
              {group.label}
            </h2>
            <PersonCardSlider>
              {group.list.map((person, i) => (
                <PersonCard
                  key={person.id}
                  name={person.name}
                  roleLabel={group.label}
                  photo_url={person.photo_url}
                  placeholderImage={DEMO_IMAGES.portrait}
                  featured={i === 0}
                />
              ))}
            </PersonCardSlider>
          </FadeInSection>
        ))}
      </div>
    </div>
  );
}
