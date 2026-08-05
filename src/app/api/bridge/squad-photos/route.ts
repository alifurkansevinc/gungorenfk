import { NextResponse } from "next/server";
import { assertBridgeApiKey } from "@/lib/bridge/auth";
import { copyRemotePhotoToSquadStorage } from "@/lib/bridge/copy-photo";
import {
  matchSquadMember,
  parseSeasonStartYear,
  seasonLabelsMatch,
  type IncomingPlayer,
  type SquadMatchCandidate,
} from "@/lib/bridge/name-match";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

type Body = {
  season?: string;
  players?: Array<{
    full_name?: string;
    shirt_number?: number | null;
    photo_url?: string;
    optaport_player_id?: string | null;
  }>;
};

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

  const season = (body.season ?? "").trim();
  if (!season || !/^\d{4}-\d{4}$/.test(season)) {
    return NextResponse.json(
      { success: false, error: "season zorunlu (örn. 2025-2026)." },
      { status: 400 },
    );
  }
  if (parseSeasonStartYear(season) === null) {
    return NextResponse.json({ success: false, error: "Geçersiz season etiketi." }, { status: 400 });
  }

  const rawPlayers = Array.isArray(body.players) ? body.players : [];
  if (rawPlayers.length === 0) {
    return NextResponse.json({ success: false, error: "players boş olamaz." }, { status: 400 });
  }
  if (rawPlayers.length > 120) {
    return NextResponse.json({ success: false, error: "En fazla 120 oyuncu." }, { status: 400 });
  }

  const incoming: IncomingPlayer[] = [];
  for (const p of rawPlayers) {
    const full_name = String(p.full_name ?? "").trim();
    const photo_url = String(p.photo_url ?? "").trim();
    if (!full_name || !photo_url) continue;
    let shirt: number | null = null;
    if (p.shirt_number != null) {
      const n = Number(p.shirt_number);
      if (Number.isInteger(n) && n >= 1 && n <= 99) shirt = n;
    }
    incoming.push({
      full_name,
      photo_url,
      shirt_number: shirt,
      optaport_player_id: p.optaport_player_id ? String(p.optaport_player_id).trim() : null,
    });
  }

  if (incoming.length === 0) {
    return NextResponse.json(
      { success: false, error: "Geçerli oyuncu (full_name + photo_url) yok." },
      { status: 400 },
    );
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
    .select("id, name, shirt_number, photo_url, season, optaport_player_id, is_active")
    .eq("is_active", true);

  if (squadErr) {
    return NextResponse.json({ success: false, error: squadErr.message }, { status: 500 });
  }

  const seasonCandidates: SquadMatchCandidate[] = (squadRows ?? [])
    .filter((r) => seasonLabelsMatch((r as { season?: string | null }).season, season))
    .map((r) => ({
      id: r.id as string,
      name: r.name as string,
      shirt_number: (r.shirt_number as number | null) ?? null,
      photo_url: (r.photo_url as string | null) ?? null,
      season: (r.season as string | null) ?? null,
      optaport_player_id: (r as { optaport_player_id?: string | null }).optaport_player_id ?? null,
    }));

  // Sezon etiketi hiç yoksa: season=null olan aktif satırları yedek havuz olarak kullan
  const pool: SquadMatchCandidate[] =
    seasonCandidates.length > 0
      ? seasonCandidates
      : (squadRows ?? [])
          .filter((r) => !(r as { season?: string | null }).season)
          .map((r) => ({
            id: r.id as string,
            name: r.name as string,
            shirt_number: (r.shirt_number as number | null) ?? null,
            photo_url: (r.photo_url as string | null) ?? null,
            season: (r.season as string | null) ?? null,
            optaport_player_id: (r as { optaport_player_id?: string | null }).optaport_player_id ?? null,
          }));

  const updated: { squad_id: string; name: string; optaport_player_id: string | null }[] = [];
  const unmatched: { full_name: string; reason: string }[] = [];
  const skipped: { full_name: string; reason: string }[] = [];
  const usedSquadIds = new Set<string>();

  for (const player of incoming) {
    const available = pool.filter((c) => !usedSquadIds.has(c.id));
    const match = matchSquadMember(player, available);
    if (!match) {
      unmatched.push({ full_name: player.full_name, reason: "Eşleşen kadro satırı yok." });
      continue;
    }

    usedSquadIds.add(match.id);

    let newPhotoUrl: string;
    try {
      newPhotoUrl = await copyRemotePhotoToSquadStorage(player.photo_url);
    } catch (e) {
      skipped.push({
        full_name: player.full_name,
        reason: e instanceof Error ? e.message : "Foto kopyalanamadı.",
      });
      usedSquadIds.delete(match.id);
      continue;
    }

    const patch: Record<string, unknown> = {
      photo_url: newPhotoUrl,
      updated_at: new Date().toISOString(),
    };
    if (player.optaport_player_id) {
      patch.optaport_player_id = player.optaport_player_id;
    }

    const { error: upErr } = await svc.from("squad").update(patch).eq("id", match.id);
    if (upErr) {
      skipped.push({ full_name: player.full_name, reason: upErr.message });
      usedSquadIds.delete(match.id);
      continue;
    }

    updated.push({
      squad_id: match.id,
      name: match.name,
      optaport_player_id: player.optaport_player_id ?? match.optaport_player_id,
    });
  }

  return NextResponse.json({
    success: true,
    season,
    pool_size: pool.length,
    updated,
    unmatched,
    skipped,
    counts: {
      updated: updated.length,
      unmatched: unmatched.length,
      skipped: skipped.length,
      incoming: incoming.length,
    },
  });
}
