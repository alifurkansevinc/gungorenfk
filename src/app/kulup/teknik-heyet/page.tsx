import Link from "next/link";
import Image from "next/image";
import { getTechnicalStaff } from "@/lib/data";
import { TECHNICAL_STAFF_ROLE_LABELS } from "@/lib/board-labels";
import { FadeInSection } from "@/components/FadeInSection";
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
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="relative border-b border-siyah/10 bg-siyah py-14 sm:py-20 text-beyaz overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-siyah/80 to-siyah" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/kulup" className="text-sm font-medium text-beyaz/70 hover:text-beyaz transition-colors">
            ← Kulüp
          </Link>
          <p className="font-display mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-bordo">
            Kulüp
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Teknik Heyet
          </h1>
          <p className="mt-3 text-beyaz/80 max-w-2xl">
            Teknik direktör, antrenörler, futbol direktörü ve kulüp yönetimi.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {groups.map((group) => (
          <FadeInSection key={group.slug} className="mb-10 sm:mb-14">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bordo mb-4">
              {group.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.list.map((person) => (
                <div
                  key={person.id}
                  className="group relative overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz p-6 transition-all duration-300 hover:shadow-xl hover:border-bordo/30"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-bordo/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-bordo/15 text-bordo font-display font-bold text-xl ring-2 ring-bordo/20">
                      {person.photo_url ? (
                        <Image src={person.photo_url} alt="" width={64} height={64} className="rounded-full object-cover" unoptimized />
                      ) : (
                        person.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-siyah">{person.name}</h3>
                      <p className="mt-0.5 text-sm font-medium text-bordo">{group.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeInSection>
        ))}
      </div>
    </div>
  );
}
