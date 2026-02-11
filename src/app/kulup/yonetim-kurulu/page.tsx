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
            Yönetim Kurulu
          </h1>
          <p className="mt-3 text-beyaz/80 max-w-2xl">
            Güngören Belediye Spor Kulübü yönetim kurulu, yüksek istişare heyeti ve danışmanlar.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {groups.map((group, groupIndex) => (
          <FadeInSection key={group.slug} className="mb-14 sm:mb-20">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-bordo mb-6">
              {group.label}
            </h2>
            <div
              className={
                group.slug === "baskan"
                  ? "grid gap-4 sm:grid-cols-1"
                  : group.slug === "baskan_vekili"
                    ? "grid gap-4 sm:grid-cols-1 max-w-xl"
                    : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {group.list.map((person, i) => (
                <div
                  key={person.id}
                  className={`
                    group relative overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz
                    transition-all duration-300 hover:shadow-xl hover:border-bordo/30
                    ${group.slug === "baskan" ? "p-8 sm:p-10 ring-2 ring-bordo/20" : "p-6"}
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-bordo/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-bordo/15 text-bordo font-display font-bold text-2xl sm:text-3xl ring-2 ring-bordo/20">
                      {person.photo_url ? (
                        <Image src={person.photo_url} alt="" width={80} height={80} className="rounded-full object-cover" unoptimized />
                      ) : (
                        person.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-siyah text-lg sm:text-xl">{person.name}</h3>
                      <p className="mt-0.5 text-sm font-medium text-bordo">
                        {group.slug === "yuksek_istisare_heyeti" || group.slug === "danisman"
                          ? group.label
                          : group.list.length === 1
                            ? group.label
                            : group.label}
                      </p>
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
