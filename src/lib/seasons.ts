/**
 * Maç / ödül kayıtlarındaki sezon etiketlerini (2025-26, 2025-2026 vb.)
 * yaklaşık kronolojik sıraya sokar — en güncel başta.
 */
/** Kronolojik sıra: büyük = daha yeni sezon (2025-26, 2025/2026, 2026-27). */
export function seasonSortKey(label: string): number {
  const s = label.trim();
  const m = s.match(/(\d{4})\s*[-/]\s*(\d{2,4})/);
  if (!m) {
    const y = s.match(/(\d{4})/);
    return y ? parseInt(y[1], 10) * 1000 : 0;
  }
  const start = parseInt(m[1], 10);
  let end = parseInt(m[2], 10);
  if (m[2].length === 2) end = start < 2100 ? Math.floor(start / 100) * 100 + end : end;
  return start * 1000 + (end % 1000);
}

export function sortSeasonLabelsDesc(seasons: string[]): string[] {
  const uniq = [...new Set(seasons.map((x) => x.trim()).filter(Boolean))];
  return uniq.sort((a, b) => seasonSortKey(b) - seasonSortKey(a));
}

/** URL ?sezon= — site: varsayılan en güncel sezon; tumu = filtre yok. */
/** Maç tarihine göre futbol sezonu etiketi (TR: Temmuz–Haziran), örn. 2025-26. */
export function seasonLabelFromMatchDate(matchDate: string): string {
  const y = parseInt(matchDate.slice(0, 4), 10);
  const mo = parseInt(matchDate.slice(5, 7), 10) || 7;
  if (Number.isNaN(y)) return "2025-26";
  const startYear = mo >= 7 ? y : y - 1;
  const endTwo = (startYear + 1) % 100;
  return `${startYear}-${String(endTwo).padStart(2, "0")}`;
}

export function resolveSeasonQueryParam(
  raw: string | undefined,
  seasonsDesc: string[],
): { filter: string | "all"; activeLabel: string | null } {
  const t = raw?.trim();
  if (t === "tumu") return { filter: "all", activeLabel: null };
  if (t && seasonsDesc.includes(t)) return { filter: t, activeLabel: t };
  if (seasonsDesc.length > 0) return { filter: seasonsDesc[0], activeLabel: seasonsDesc[0] };
  return { filter: "all", activeLabel: null };
}
