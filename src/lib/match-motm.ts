/** Taraftar maçın oyuncusu oylama penceresi (admin: motm_vote_*). */

export type MatchMotmPublicCandidate = {
  squadMemberId: string;
  name: string;
  shirtNumber: number | null;
  photoUrl: string | null;
  position: string | null;
  votes: number;
};

export type MatchMotmWindow = {
  motm_vote_starts_at: string | null;
  motm_vote_ends_at: string | null;
};

export function isMotmVotingOpen(row: MatchMotmWindow, nowMs: number = Date.now()): boolean {
  if (!row.motm_vote_starts_at || !row.motm_vote_ends_at) return false;
  const a = new Date(row.motm_vote_starts_at).getTime();
  const b = new Date(row.motm_vote_ends_at).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return false;
  return nowMs >= a && nowMs <= b;
}

/** datetime-local (tarayıcı yerel) için ISO → input value */
export function isoToDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local değerini ISO UTC stringe çevir (FormData → DB) */
export function datetimeLocalToIso(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
