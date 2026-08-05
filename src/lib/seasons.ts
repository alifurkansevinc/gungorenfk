import {
  formatSeasonTabLabel,
  getFootballSeasonLabelForDate,
  parseSeasonStartYear,
  toCanonicalSeasonKey,
} from "@/lib/football-season";

export { formatSeasonTabLabel, getFootballSeasonLabelForDate, toCanonicalSeasonKey };

/**
 * Maç / ödül kayıtlarındaki sezon etiketlerini yaklaşık kronolojik sıraya sokar — en güncel başta.
 */
export function seasonSortKey(label: string): number {
  const y = parseSeasonStartYear(label);
  if (y != null) return y * 1000 + (y + 1);
  const s = label.trim();
  const m = s.match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
  if (!m) {
    const lone = s.match(/(\d{4})/);
    return lone ? parseInt(lone[1], 10) * 1000 : 0;
  }
  const start = parseInt(m[1], 10);
  let end = parseInt(m[2], 10);
  if (m[2].length === 2) end = Math.floor(start / 100) * 100 + end;
  return start * 1000 + (end % 1000);
}

export function sortSeasonLabelsDesc(seasons: string[]): string[] {
  const canon = seasons
    .map((x) => toCanonicalSeasonKey(x.trim()))
    .filter((k) => k && k !== "diger");
  const uniq = [...new Set(canon)];
  return uniq.sort((a, b) => seasonSortKey(b) - seasonSortKey(a));
}

/** Maç tarihine göre futbol sezonu (1 Haziran–31 Mayıs), örn. 2025-2026. */
export function seasonLabelFromMatchDate(matchDate: string): string {
  const d = new Date(`${matchDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return getFootballSeasonLabelForDate(new Date());
  return getFootballSeasonLabelForDate(d);
}

/** Kısa etiket 2025-26 (eski kayıtlar / Mackolik uyumu). */
export function toShortSeasonLabel(canonicalOrAny: string): string {
  const y = parseSeasonStartYear(canonicalOrAny);
  if (y == null) return canonicalOrAny.trim();
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}

/** Filtre için olası sezon string varyantları. */
export function seasonFilterVariants(season: string): string[] {
  const key = toCanonicalSeasonKey(season);
  if (key === "diger") return [season.trim()].filter(Boolean);
  const short = toShortSeasonLabel(key);
  const slash = `${key.slice(0, 4)}/${key.slice(5)}`;
  return [...new Set([key, short, slash, season.trim()].filter(Boolean))];
}

export function resolveSeasonQueryParam(
  raw: string | undefined,
  seasonsDesc: string[],
): { filter: string | "all"; activeLabel: string | null } {
  const t = raw?.trim();
  if (t === "tumu") return { filter: "all", activeLabel: null };
  if (t) {
    const want = toCanonicalSeasonKey(t);
    const hit = seasonsDesc.find((s) => toCanonicalSeasonKey(s) === want);
    if (hit) return { filter: hit, activeLabel: formatSeasonTabLabel(hit) };
    if (seasonsDesc.includes(t)) return { filter: t, activeLabel: formatSeasonTabLabel(t) };
  }
  if (seasonsDesc.length > 0) {
    return { filter: seasonsDesc[0]!, activeLabel: formatSeasonTabLabel(seasonsDesc[0]!) };
  }
  return { filter: "all", activeLabel: null };
}

/** Maç sekmesi -> Mackolik puan tablosu "2025/2026". */
export function matchSeasonTabToStandingsSeason(tab: string): string {
  const y = parseSeasonStartYear(tab);
  if (y == null) return tab.trim();
  return `${y}/${y + 1}`;
}
