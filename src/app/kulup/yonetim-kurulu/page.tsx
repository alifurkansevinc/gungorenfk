import Link from "next/link";
import Image from "next/image";
import { getBoardMembers } from "@/lib/data";
import { BOARD_ROLE_LABELS } from "@/lib/board-labels";
import { FadeInSection } from "@/components/FadeInSection";
import type { BoardMember } from "@/types/db";
import { DEMO_IMAGES } from "@/lib/demo-images";

const ROLE_ORDER = ["baskan", "baskan_vekili", "as_baskan", "yk_uyesi", "yuksek_istisare_heyeti", "danisman"] as const;

function groupByRole(members: BoardMember[]) {
  const map = new Map<string, BoardMember[]>();
  for (const r of ROLE_ORDER) map.set(r, []);
  for (const m of members) {
    const list = map.get(m.role_slug);
    if (list) list.push(m);
    else map.set(m.role_slug, [m]);
  }
  return ROLE_ORDER.map((slug) => ({ slug, label: BOARD_ROLE_LABELS[slug] ?? slug, list: map.get(slug) ?? [] })).filter(
    (g) => g.list.length > 0
  );
}

export const metadata = {
  title: "Yönetim Kurulu | Güngören FK",
  description: "Güngören Belediye Spor Kulübü yönetim kurulu.",
};

export default async function YonetimKuruluPage() {
  const members = await getBoardMembers();
  const groups = groupByRole(members);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="relative border-b border-siyah/10 bg-siyah py-8 sm:py-10 text-beyaz overflow-hidden">
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
            Yönetim Kurulu
          </h1>
          <p className="mt-2 text-sm text-beyaz/80 max-w-2xl">
            Güngören Belediye Spor Kulübü yönetim kurulu, yüksek istişare heyeti ve danışmanlar.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {groups.map((group) => (
          <FadeInSection key={group.slug} className="mb-10 sm:mb-14">
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-bordo mb-4">
              {group.label}
            </h2>
            <div
              className={
                group.slug === "baskan"
                  ? "grid gap-4 sm:grid-cols-1 max-w-md"
                  : group.slug === "baskan_vekili"
                    ? "grid gap-4 sm:grid-cols-1 max-w-sm"
                    : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }
            >
              {group.list.map((person) => (
                <div
                  key={person.id}
                  className={`
                    group relative overflow-hidden rounded-xl border border-siyah/10 bg-beyaz
                    transition-all duration-300 hover:shadow-lg hover:shadow-bordo/10 hover:border-bordo/25
                    ${group.slug === "baskan" ? "p-5 sm:p-6 ring-2 ring-bordo/20" : "p-4"}
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-bordo/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-bordo/10 ring-2 ring-bordo/20 sm:h-14 sm:w-14">
                      {person.photo_url ? (
                        <Image src={person.photo_url} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                      ) : (
                        <Image src={DEMO_IMAGES.portrait} alt="" fill className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105" unoptimized />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold text-siyah text-sm sm:text-base truncate">{person.name}</h3>
                      <p className="mt-0.5 text-xs font-medium text-bordo">{group.label}</p>
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
