/**
 * Futbol sezonu: 1 Haziran – 31 Mayıs (etiket: "2025-2026").
 * Optaport ile aynı mantık — köprü sync ve kadro sekmeleri için.
 */

const MONTH_JUNE = 5; // 0-based

export function getFootballSeasonLabelForDate(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth();
  const startYear = m >= MONTH_JUNE ? y : y - 1;
  return `${startYear}-${startYear + 1}`;
}

/** "2025-2026" / "2025-26" / "25-26" / "25-26 Sezon Kadrosu" → başlangıç yılı veya null. */
export function parseSeasonStartYear(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = raw.trim().replace(/\s+/g, " ");
  const m4 = /(\d{4})\s*[-/]\s*(\d{4})/.exec(t);
  if (m4) {
    const y1 = parseInt(m4[1], 10);
    const y2 = parseInt(m4[2], 10);
    if (y2 === y1 + 1) return y1;
  }
  const m42 = /(\d{4})\s*[-/]\s*(\d{2})\b/.exec(t);
  if (m42) {
    const y1 = parseInt(m42[1], 10);
    const y2 = 2000 + parseInt(m42[2], 10);
    if (y2 === y1 + 1) return y1;
  }
  const m2 = /(\d{2})\s*[-/]\s*(\d{2})\b/.exec(t);
  if (m2) {
    const y1 = 2000 + parseInt(m2[1], 10);
    const y2 = 2000 + parseInt(m2[2], 10);
    if (y2 === y1 + 1) return y1;
  }
  return null;
}

/** Kanonik sezon anahtarı: YYYY-YYYY; parse edilemezse trim edilmiş metin. */
export function toCanonicalSeasonKey(raw: string | null | undefined): string {
  const y = parseSeasonStartYear(raw);
  if (y != null) return `${y}-${y + 1}`;
  const t = (raw || "").trim();
  return t || "diger";
}

/** Sekme başlığı: "2025–2026" */
export function formatSeasonTabLabel(canonicalKey: string): string {
  const y = parseSeasonStartYear(canonicalKey);
  if (y != null) return `${y}–${y + 1}`;
  if (canonicalKey === "diger") return "Diğer";
  return canonicalKey;
}

export function seasonLabelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ya = parseSeasonStartYear(a);
  const yb = parseSeasonStartYear(b);
  if (ya !== null && yb !== null) return ya === yb;
  if (!a || !b) return false;
  return a.trim().toLocaleLowerCase("tr-TR") === b.trim().toLocaleLowerCase("tr-TR");
}

export type SeasonGroup<T extends { season?: string | null; sort_order?: number }> = {
  key: string;
  label: string;
  startYear: number | null;
  members: T[];
};

/** Sezonlara göre grupla; en yeni sezon önce. */
export function groupByFootballSeason<T extends { season?: string | null; sort_order?: number }>(
  items: T[],
): SeasonGroup<T>[] {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = toCanonicalSeasonKey(item.season);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  const groups: SeasonGroup<T>[] = Array.from(map.entries()).map(([key, members]) => ({
    key,
    label: formatSeasonTabLabel(key),
    startYear: parseSeasonStartYear(key),
    members: [...members].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));

  groups.sort((a, b) => {
    if (a.startYear != null && b.startYear != null) return b.startYear - a.startYear;
    if (a.startYear != null) return -1;
    if (b.startYear != null) return 1;
    if (a.key === "diger") return 1;
    if (b.key === "diger") return -1;
    return a.label.localeCompare(b.label, "tr");
  });

  return groups;
}

/** Varsayılan açık sekme: güncel futbol sezonu varsa o, yoksa en yeni. */
export function pickDefaultSeasonKey(groups: { key: string; startYear: number | null }[]): string {
  if (groups.length === 0) return "";
  const current = getFootballSeasonLabelForDate(new Date());
  const hit = groups.find((g) => g.key === current);
  if (hit) return hit.key;
  return groups[0]!.key;
}
