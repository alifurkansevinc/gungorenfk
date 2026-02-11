import type { SquadMember } from "@/types/db";

/** Pozisyon veya position_category → kategori slug (gruplama için) */
export const POSITION_TO_CATEGORY: Record<string, string> = {
  Kaleci: "kl",
  "Sağ Bek": "bek",
  "Sol Bek": "bek",
  Bek: "bek",
  Stoper: "stoper",
  "Ön Libero": "ortasaha",
  "Orta Saha": "ortasaha",
  "Sağ Kanat": "kanat",
  "Sol Kanat": "kanat",
  Kanat: "kanat",
  Forvet: "forvet",
  kl: "kl",
  bek: "bek",
  stoper: "stoper",
  ortasaha: "ortasaha",
  kanat: "kanat",
  forvet: "forvet",
};

/** Kategori slug → görünen başlık */
export const CATEGORY_LABELS: Record<string, string> = {
  kl: "Kaleci",
  bek: "Bekler",
  stoper: "Stoperler",
  ortasaha: "Orta Saha",
  kanat: "Kanatlar",
  forvet: "Hücumcular",
};

/** Kadro kategorileri sırası */
export const CATEGORY_ORDER = ["kl", "bek", "stoper", "ortasaha", "kanat", "forvet"] as const;

export function getCategorySlug(m: SquadMember): string {
  const cat = m.position_category ?? (m.position ? POSITION_TO_CATEGORY[m.position] : null);
  return cat ?? "ortasaha";
}

export function groupSquadByCategory(squad: SquadMember[]): { captains: SquadMember[]; byCategory: { slug: string; label: string; players: SquadMember[] }[] } {
  const captains = squad.filter((p) => p.is_captain);
  const rest = squad.filter((p) => !p.is_captain);
  const map = new Map<string, SquadMember[]>();
  for (const slug of CATEGORY_ORDER) map.set(slug, []);
  for (const p of rest) {
    const slug = getCategorySlug(p);
    const list = map.get(slug) ?? [];
    list.push(p);
    map.set(slug, list);
  }
  const byCategory = CATEGORY_ORDER.map((slug) => ({
    slug,
    label: CATEGORY_LABELS[slug],
    players: (map.get(slug) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  })).filter((g) => g.players.length > 0);
  return { captains, byCategory };
}
