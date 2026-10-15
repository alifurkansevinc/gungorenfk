/**
 * Güngören FK profesyonel Süper Lig’de oynamıyor.
 * Optaport varsayılanı “Süper Lig” diye gelen lig maçları Süper Amatör Lig’dir.
 * Başka müsabaka adlarına dokunulmaz.
 */
export function normalizeSiteCompetition(raw: string | null | undefined): string | null {
  const t = (raw || "").trim().replace(/\s+/g, " ");
  if (!t) return null;
  const key = t.toLocaleLowerCase("tr-TR").replace(/\s+/g, "");
  if (key === "süperlig" || key === "superlig") return "Süper Amatör Lig";
  return t;
}
