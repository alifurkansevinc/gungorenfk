/**
 * Maç takvimi: Türkiye saati (UTC+3, DST yok) ile kickoff; bitiş = kickoff + 2 saat.
 * scheduled → live (kickoff geçti, bitiş öncesi), live/scheduled → finished (bitiş geçti).
 */

import { createServiceRoleClient } from "@/lib/supabase/service";

const TR_TZ_SUFFIX = "+03:00";
/** Maç günü + uzatma (normal süre, uzatmalar); canlı sayım ve otomatik bitiş için. */
const LIVE_DURATION_MS = 4 * 60 * 60 * 1000;

/** Takvim günü (YYYY-MM-DD) İstanbul saatiyle — maç tarihi karşılaştırmaları için. */
export function calendarDateTr(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

/** Boş saat → 15:00 (gün ortası varsayılan). */
export function normalizeMatchTimeForKickoff(matchTime: string | null | undefined): string {
  const t = matchTime?.trim();
  if (!t) return "15:00";
  const m = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return "15:00";
  const hh = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  return `${hh}:${mm}`;
}

export function getMatchKickoffMs(matchDate: string, matchTime: string | null | undefined): number | null {
  const d = matchDate?.trim();
  if (!d) return null;
  const hm = normalizeMatchTimeForKickoff(matchTime);
  const ms = new Date(`${d}T${hm}:00${TR_TZ_SUFFIX}`).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function getMatchEndMs(matchDate: string, matchTime: string | null | undefined): number | null {
  const k = getMatchKickoffMs(matchDate, matchTime);
  if (k == null) return null;
  return k + LIVE_DURATION_MS;
}

export function matchEndAtIso(matchDate: string, matchTime: string | null | undefined): string | null {
  const end = getMatchEndMs(matchDate, matchTime);
  return end != null ? new Date(end).toISOString() : null;
}

/** DB henüz güncellenmese bile (service role yok / gecikme): şu an saha içi penceresinde mi? */
export function isWithinLivePlayWindow(
  matchDate: string,
  matchTime: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  const kick = getMatchKickoffMs(matchDate, matchTime);
  if (kick == null) return false;
  return nowMs >= kick && nowMs < kick + LIVE_DURATION_MS;
}

/**
 * Kart / detay için görünen durum: scheduled ama kickoff–bitiş arasındaysa canlı gibi davran.
 * `live` ve `finished` DB değerlerine saygı.
 */
export function getEffectiveMatchStatus(
  row: { match_date: string; match_time: string | null | undefined; status: string },
  nowMs: number = Date.now(),
): string {
  const s = row.status;
  if (s === "postponed" || s === "cancelled") return s;
  if (s === "finished") return "finished";
  if (s === "live") return "live";
  if (s === "scheduled" && isWithinLivePlayWindow(row.match_date, row.match_time, nowMs)) return "live";
  return s;
}

/**
 * Okuma anında scheduled/live maçları günceller (sayfa/API yükü).
 * postponed / cancelled / finished dokunulmaz.
 */
export async function syncMatchStatusesFromSchedule(): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const svc = createServiceRoleClient();
  const now = Date.now();
  const { data: rows, error } = await svc
    .from("matches")
    .select("id, match_date, match_time, status")
    .in("status", ["scheduled", "live"]);
  if (error || !rows?.length) return;

  for (const row of rows as { id: string; match_date: string; match_time: string | null; status: string }[]) {
    const kick = getMatchKickoffMs(row.match_date, row.match_time);
    if (kick == null) continue;
    const end = kick + LIVE_DURATION_MS;
    if (row.status === "scheduled") {
      if (now >= kick && now < end) {
        await svc.from("matches").update({ status: "live", updated_at: new Date().toISOString() }).eq("id", row.id);
      } else if (now >= end) {
        await svc.from("matches").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id", row.id);
      }
    } else if (row.status === "live" && now >= end) {
      await svc.from("matches").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id", row.id);
    }
  }
}
