import { NextResponse } from "next/server";
import { assertBridgeApiKey } from "@/lib/bridge/auth";
import { seasonLabelsMatch } from "@/lib/bridge/name-match";
import { parseSeasonStartYear, toCanonicalSeasonKey } from "@/lib/football-season";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 120;

type IncomingLineup = {
  optaport_player_id?: string;
  role?: "starter" | "substitute";
  sort_order?: number | null;
};

type IncomingGoal = {
  minute?: number;
  scorer_optaport_player_id?: string;
  assist_optaport_player_id?: string | null;
};

type IncomingEvent = {
  optaport_event_id?: string;
  minute?: number | null;
  type?: string;
  player_name?: string | null;
  optaport_player_id?: string | null;
  related_player_name?: string | null;
  related_optaport_player_id?: string | null;
  meta?: Record<string, unknown> | null;
};

type IncomingMatch = {
  optaport_match_id?: string;
  opponent_name?: string;
  home_away?: "home" | "away";
  venue?: string | null;
  match_date?: string;
  match_time?: string | null;
  competition?: string | null;
  goals_for?: number | null;
  goals_against?: number | null;
  status?: string;
  lineup?: IncomingLineup[];
  goals?: IncomingGoal[];
  events?: IncomingEvent[];
};

type Body = {
  season?: string;
  matches?: IncomingMatch[];
};

const SITE_STATUSES = new Set(["scheduled", "live", "finished", "postponed", "cancelled"]);

function mapStatus(raw: string | undefined): string {
  const s = (raw || "scheduled").toLowerCase();
  if (s === "played" || s === "finalized") return "finished";
  if (SITE_STATUSES.has(s)) return s;
  return "scheduled";
}

function normalizeTime(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const t = raw.trim();
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return t.slice(0, 8) || null;
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

/**
 * POST /api/bridge/matches-sync
 * Optaport fikstür + kafile + gol + maç olayları sync.
 * optaport_match_id ile upsert; silmez. Lineup/goller/olaylar maç bazında yenilenir.
 */
export async function POST(request: Request) {
  const gate = assertBridgeApiKey(request);
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ success: false, error: "Geçersiz JSON." }, { status: 400 });
  }

  const seasonRaw = (body.season ?? "").trim();
  if (!seasonRaw || parseSeasonStartYear(seasonRaw) === null) {
    return NextResponse.json(
      { success: false, error: "season zorunlu (örn. 2025-2026)." },
      { status: 400 },
    );
  }
  const season = toCanonicalSeasonKey(seasonRaw);

  const rawMatches = Array.isArray(body.matches) ? body.matches : [];
  if (rawMatches.length === 0) {
    return NextResponse.json({ success: false, error: "matches boş olamaz." }, { status: 400 });
  }
  if (rawMatches.length > 120) {
    return NextResponse.json({ success: false, error: "En fazla 120 maç." }, { status: 400 });
  }

  let svc;
  try {
    svc = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Supabase yapılandırması eksik." },
      { status: 500 },
    );
  }

  const { data: squadRows, error: squadErr } = await svc
    .from("squad")
    .select("id, season, optaport_player_id")
    .not("optaport_player_id", "is", null);

  if (squadErr) {
    return NextResponse.json({ success: false, error: squadErr.message }, { status: 500 });
  }

  /** Aynı optaport oyuncusu birden fazla sezonda olabilir — bu sezonu tercih et */
  const squadByOptaport = new Map<string, string>();
  for (const r of squadRows ?? []) {
    const row = r as { id: string; season: string | null; optaport_player_id: string | null };
    if (!row.optaport_player_id) continue;
    if (seasonLabelsMatch(row.season, season)) {
      squadByOptaport.set(row.optaport_player_id, row.id);
    } else if (!squadByOptaport.has(row.optaport_player_id)) {
      squadByOptaport.set(row.optaport_player_id, row.id);
    }
  }

  const optaportIds = rawMatches
    .map((m) => (m.optaport_match_id || "").trim())
    .filter(Boolean);

  const existingByOptaport = new Map<string, string>();
  if (optaportIds.length > 0) {
    const { data: existing } = await svc
      .from("matches")
      .select("id, optaport_match_id")
      .in("optaport_match_id", optaportIds);
    for (const row of existing ?? []) {
      const r = row as { id: string; optaport_match_id: string | null };
      if (r.optaport_match_id) existingByOptaport.set(r.optaport_match_id, r.id);
    }
  }

  let created = 0;
  let updated = 0;
  let lineupRows = 0;
  let goalRows = 0;
  let eventRows = 0;
  let skipped = 0;
  const warnings: { optaport_match_id?: string; opponent?: string; reason: string }[] = [];

  const EVENT_TYPES = new Set([
    "goal",
    "assist",
    "yellow_card",
    "red_card",
    "sub_in",
    "sub_out",
    "injury",
    "opponent_goal",
  ]);

  for (const m of rawMatches) {
    const optaportMatchId = (m.optaport_match_id || "").trim();
    const opponent = (m.opponent_name || "").trim();
    const matchDate = (m.match_date || "").trim().slice(0, 10);
    const homeAway = m.home_away === "away" ? "away" : "home";

    if (!optaportMatchId || !opponent || !/^\d{4}-\d{2}-\d{2}$/.test(matchDate)) {
      skipped += 1;
      warnings.push({
        optaport_match_id: optaportMatchId || undefined,
        opponent: opponent || undefined,
        reason: "optaport_match_id, opponent_name veya match_date eksik/geçersiz.",
      });
      continue;
    }

    const payload = {
      opponent_name: opponent,
      home_away: homeAway,
      venue: (m.venue || "").trim() || null,
      match_date: matchDate,
      match_time: normalizeTime(m.match_time),
      competition: (m.competition || "").trim() || null,
      season,
      goals_for: typeof m.goals_for === "number" ? m.goals_for : m.goals_for == null ? null : Number(m.goals_for),
      goals_against:
        typeof m.goals_against === "number"
          ? m.goals_against
          : m.goals_against == null
            ? null
            : Number(m.goals_against),
      status: mapStatus(m.status),
      optaport_match_id: optaportMatchId,
      is_hidden: false,
    };

    let matchId = existingByOptaport.get(optaportMatchId) ?? null;

    if (matchId) {
      const { error: updErr } = await svc.from("matches").update(payload).eq("id", matchId);
      if (updErr) {
        skipped += 1;
        warnings.push({ optaport_match_id: optaportMatchId, opponent, reason: updErr.message });
        continue;
      }
      updated += 1;
    } else {
      const { data: inserted, error: insErr } = await svc
        .from("matches")
        .insert(payload)
        .select("id")
        .single();
      if (insErr || !inserted?.id) {
        skipped += 1;
        warnings.push({
          optaport_match_id: optaportMatchId,
          opponent,
          reason: insErr?.message ?? "Maç eklenemedi.",
        });
        continue;
      }
      matchId = inserted.id as string;
      existingByOptaport.set(optaportMatchId, matchId);
      created += 1;
    }

    // Lineup: tamamen yenile
    await svc.from("match_lineups").delete().eq("match_id", matchId);
    const lineupIn = Array.isArray(m.lineup) ? m.lineup : [];
    const lineupInsert: {
      match_id: string;
      squad_member_id: string;
      role: "starter" | "substitute";
      sort_order: number;
    }[] = [];
    const seenSquad = new Set<string>();
    for (const [idx, row] of lineupIn.entries()) {
      const pid = (row.optaport_player_id || "").trim();
      if (!pid) continue;
      const squadId = squadByOptaport.get(pid);
      if (!squadId) {
        warnings.push({
          optaport_match_id: optaportMatchId,
          opponent,
          reason: `Kafile oyuncusu sitede yok (önce kadro sync): ${pid}`,
        });
        continue;
      }
      if (seenSquad.has(squadId)) continue;
      seenSquad.add(squadId);
      const role = row.role === "substitute" ? "substitute" : "starter";
      lineupInsert.push({
        match_id: matchId,
        squad_member_id: squadId,
        role,
        sort_order: typeof row.sort_order === "number" ? row.sort_order : idx,
      });
    }
    if (lineupInsert.length > 0) {
      const { error: linErr } = await svc.from("match_lineups").insert(lineupInsert);
      if (linErr) {
        warnings.push({
          optaport_match_id: optaportMatchId,
          opponent,
          reason: `Lineup: ${linErr.message}`,
        });
      } else {
        lineupRows += lineupInsert.length;
      }
    }

    // Goals: tamamen yenile
    await svc.from("match_goals").delete().eq("match_id", matchId);
    const goalsIn = Array.isArray(m.goals) ? m.goals : [];
    const goalInsert: {
      match_id: string;
      minute: number;
      scorer_squad_id: string;
      assist_squad_id: string | null;
    }[] = [];
    for (const g of goalsIn) {
      const scorerPid = (g.scorer_optaport_player_id || "").trim();
      const scorerId = scorerPid ? squadByOptaport.get(scorerPid) : null;
      if (!scorerId) {
        if (scorerPid) {
          warnings.push({
            optaport_match_id: optaportMatchId,
            opponent,
            reason: `Gol atan oyuncu sitede yok: ${scorerPid}`,
          });
        }
        continue;
      }
      const minute = Number(g.minute);
      if (!Number.isFinite(minute) || minute < 0) continue;
      const assistPid = (g.assist_optaport_player_id || "").trim();
      const assistId = assistPid ? squadByOptaport.get(assistPid) ?? null : null;
      goalInsert.push({
        match_id: matchId,
        minute: Math.min(Math.floor(minute), 200),
        scorer_squad_id: scorerId,
        assist_squad_id: assistId,
      });
    }
    if (goalInsert.length > 0) {
      const { error: goalErr } = await svc.from("match_goals").insert(goalInsert);
      if (goalErr) {
        warnings.push({
          optaport_match_id: optaportMatchId,
          opponent,
          reason: `Goller: ${goalErr.message}`,
        });
      } else {
        goalRows += goalInsert.length;
      }
    }

    // Events: tamamen yenile
    await svc.from("match_events").delete().eq("match_id", matchId);
    const eventsIn = Array.isArray(m.events) ? m.events : [];
    const eventInsert: {
      match_id: string;
      optaport_event_id: string | null;
      minute: number | null;
      event_type: string;
      player_name: string | null;
      player_squad_id: string | null;
      optaport_player_id: string | null;
      related_player_name: string | null;
      related_squad_id: string | null;
      related_optaport_player_id: string | null;
      meta: Record<string, unknown>;
      sort_order: number;
    }[] = [];

    for (const [idx, ev] of eventsIn.entries()) {
      let typ = (ev.type || "").trim().toLowerCase();
      if (typ === "goal" && ev.meta?.opponent === true) typ = "opponent_goal";
      if (!EVENT_TYPES.has(typ)) continue;

      const pid = (ev.optaport_player_id || "").trim() || null;
      const relatedPid = (ev.related_optaport_player_id || "").trim() || null;
      const minuteRaw = ev.minute;
      const minute =
        minuteRaw == null || !Number.isFinite(Number(minuteRaw))
          ? null
          : Math.min(Math.max(Math.floor(Number(minuteRaw)), 0), 200);

      eventInsert.push({
        match_id: matchId,
        optaport_event_id: (ev.optaport_event_id || "").trim() || null,
        minute,
        event_type: typ,
        player_name: (ev.player_name || "").trim() || null,
        player_squad_id: pid ? squadByOptaport.get(pid) ?? null : null,
        optaport_player_id: pid,
        related_player_name: (ev.related_player_name || "").trim() || null,
        related_squad_id: relatedPid ? squadByOptaport.get(relatedPid) ?? null : null,
        related_optaport_player_id: relatedPid,
        meta: ev.meta && typeof ev.meta === "object" ? ev.meta : {},
        sort_order: idx,
      });
    }

    if (eventInsert.length > 0) {
      const { error: evErr } = await svc.from("match_events").insert(eventInsert);
      if (evErr) {
        warnings.push({
          optaport_match_id: optaportMatchId,
          opponent,
          reason: `Olaylar: ${evErr.message}`,
        });
      } else {
        eventRows += eventInsert.length;
      }
    }
  }

  return NextResponse.json({
    success: true,
    season,
    counts: {
      incoming: rawMatches.length,
      created,
      updated,
      skipped,
      lineup_rows: lineupRows,
      goal_rows: goalRows,
      event_rows: eventRows,
      squad_mapped: squadByOptaport.size,
    },
    warnings: warnings.slice(0, 40),
  });
}
