export { parseSeasonStartYear, seasonLabelsMatch } from "@/lib/football-season";

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
