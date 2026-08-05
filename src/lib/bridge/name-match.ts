/** Türkçe karakterleri normalize ederek karşılaştırma anahtarı üretir. */
export function normalizePersonName(raw: string): string {
  return raw
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "2025-2026" / "25-26" / "25-26 Sezon Kadrosu" → başlangıç yılı veya null. */
export function parseSeasonStartYear(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const t = raw.trim().replace(/\s+/g, " ");
  const m4 = /(\d{4})\s*[-/]\s*(\d{4})/.exec(t);
  if (m4) {
    const y1 = parseInt(m4[1], 10);
    const y2 = parseInt(m4[2], 10);
    if (y2 === y1 + 1) return y1;
  }
  const m2 = /(\d{2})\s*[-/]\s*(\d{2})/.exec(t);
  if (m2) {
    const y1 = 2000 + parseInt(m2[1], 10);
    const y2 = 2000 + parseInt(m2[2], 10);
    if (y2 === y1 + 1) return y1;
  }
  return null;
}

export function seasonLabelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ya = parseSeasonStartYear(a);
  const yb = parseSeasonStartYear(b);
  if (ya !== null && yb !== null) return ya === yb;
  if (!a || !b) return false;
  return normalizePersonName(a) === normalizePersonName(b);
}

export type SquadMatchCandidate = {
  id: string;
  name: string;
  shirt_number: number | null;
  optaport_player_id: string | null;
  photo_url: string | null;
  season: string | null;
};

export type IncomingPlayer = {
  full_name: string;
  shirt_number?: number | null;
  photo_url: string;
  optaport_player_id?: string | null;
};

/**
 * Eşleştirme sırası:
 * 1) optaport_player_id
 * 2) normalize isim + forma no
 * 3) yalnızca normalize isim (tek aday)
 */
export function matchSquadMember(
  incoming: IncomingPlayer,
  candidates: SquadMatchCandidate[],
): SquadMatchCandidate | null {
  const opId = incoming.optaport_player_id?.trim();
  if (opId) {
    const byId = candidates.find((c) => c.optaport_player_id === opId);
    if (byId) return byId;
  }

  const nameKey = normalizePersonName(incoming.full_name);
  if (!nameKey) return null;

  const sameName = candidates.filter((c) => normalizePersonName(c.name) === nameKey);
  if (sameName.length === 0) return null;

  const shirt = incoming.shirt_number;
  if (shirt != null && Number.isFinite(shirt)) {
    const withShirt = sameName.filter((c) => c.shirt_number === shirt);
    if (withShirt.length === 1) return withShirt[0];
    if (withShirt.length > 1) return null;
  }

  if (sameName.length === 1) return sameName[0];
  return null;
}
