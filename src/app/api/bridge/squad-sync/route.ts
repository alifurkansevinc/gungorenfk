import { NextResponse } from "next/server";
import { assertBridgeApiKey } from "@/lib/bridge/auth";
import { copyRemotePhotoToSquadStorage } from "@/lib/bridge/copy-photo";
import {
  matchSquadMember,
  parseSeasonStartYear,
  seasonLabelsMatch,
  type SquadMatchCandidate,
} from "@/lib/bridge/name-match";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const maxDuration = 120;

type IncomingPlayer = {
  optaport_player_id?: string | null;
  full_name?: string;
  shirt_number?: number | null;
  position?: string | null;
  position_category?: string | null;
  photo_url?: string | null;
  sort_order?: number | null;
  is_captain?: boolean | null;
  is_active?: boolean | null;
  bio?: string | null;
};

type Body = {
  season?: string;
  /** upsert_season: güncelle/ekle; sezon dışı kalanları is_active=false yap (silme yok — maç FK) */
  sync_mode?: string;
  players?: IncomingPlayer[];
};

const VALID_CATEGORIES = new Set(["kl", "bek", "stoper", "ortasaha", "kanat", "forvet"]);

/**
 * POST /api/bridge/squad-sync
 * Optaport tam kadro sync. optaport_player_id ile upsert; silmez (maç modülü için).
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

  const season = (body.season ?? "").trim();
  if (!season || parseSeasonStartYear(season) === null) {
    return NextResponse.json(
      { success: false, error: "season zorunlu (örn. 2025-2026)." },
      { status: 400 },
    );
  }

  const rawPlayers = Array.isArray(body.players) ? body.players : [];
  if (rawPlayers.length === 0) {
    return NextResponse.json({ success: false, error: "players boş olamaz." }, { status: 400 });
  }
  if (rawPlayers.length > 80) {
    return NextResponse.json({ success: false, error: "En fazla 80 oyuncu." }, { status: 400 });
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
    .select(
      "id, name, shirt_number, photo_url, season, optaport_player_id, is_active, position, position_category, sort_order, is_captain",
    );

  if (squadErr) {
    return NextResponse.json({ success: false, error: squadErr.message }, { status: 500 });
  }

  const allRows = (squadRows ?? []) as Array<{
    id: string;
    name: string;
    shirt_number: number | null;
    photo_url: string | null;
    season: string | null;
    optaport_player_id: string | null;
    is_active: boolean;
    position: string | null;
    position_category: string | null;
    sort_order: number;
    is_captain: boolean;
  }>;

  const seasonPool: SquadMatchCandidate[] = allRows
    .filter((r) => seasonLabelsMatch(r.season, season))
    .map((r) => ({
      id: r.id,
      name: r.name,
      shirt_number: r.shirt_number,
      photo_url: r.photo_url,
      season: r.season,
      optaport_player_id: r.optaport_player_id,
    }));

  // Global id index (aynı oyuncu başka sezonda da olabilir)
  const byOptaportId = new Map<string, (typeof allRows)[0]>();
  for (const r of allRows) {
    if (r.optaport_player_id) byOptaportId.set(r.optaport_player_id, r);
  }

  const created: { squad_id: string; name: string; optaport_player_id: string }[] = [];
  const updated: { squad_id: string; name: string; optaport_player_id: string | null }[] = [];
  const skipped: { full_name: string; reason: string }[] = [];
  const syncedSquadIds = new Set<string>();

  let sortFallback = 0;
  for (const p of rawPlayers) {
    const fullName = String(p.full_name ?? "").trim();
    const opId = p.optaport_player_id ? String(p.optaport_player_id).trim() : null;
    if (!fullName) {
      skipped.push({ full_name: "(boş)", reason: "full_name gerekli." });
      continue;
    }

    let shirt: number | null = null;
    if (p.shirt_number != null) {
      const n = Number(p.shirt_number);
      if (Number.isInteger(n) && n >= 1 && n <= 99) shirt = n;
    }

    const position = p.position ? String(p.position).trim() : null;
    let positionCategory = p.position_category ? String(p.position_category).trim() : null;
    if (positionCategory && !VALID_CATEGORIES.has(positionCategory)) positionCategory = null;

    const sortOrder =
      typeof p.sort_order === "number" && Number.isFinite(p.sort_order)
        ? Math.trunc(p.sort_order)
        : ++sortFallback;

    const isCaptain = Boolean(p.is_captain);
    const isActive = p.is_active === false ? false : true;
    const bio = p.bio != null ? String(p.bio).trim() || null : undefined;

    // Match: 1) optaport id in same season pool 2) optaport id any season (reuse row if season matches or create) 3) name match in season
    let matchRow = opId
      ? seasonPool.find((c) => c.optaport_player_id === opId) ?? null
      : null;

    if (!matchRow && opId) {
      const any = byOptaportId.get(opId);
      if (any && seasonLabelsMatch(any.season, season)) {
        matchRow = {
          id: any.id,
          name: any.name,
          shirt_number: any.shirt_number,
          photo_url: any.photo_url,
          season: any.season,
          optaport_player_id: any.optaport_player_id,
        };
      }
    }

    if (!matchRow) {
      const available = seasonPool.filter((c) => !syncedSquadIds.has(c.id));
      const m = matchSquadMember(
        {
          full_name: fullName,
          shirt_number: shirt,
          photo_url: p.photo_url || "x",
          optaport_player_id: opId,
        },
        available,
      );
      if (m) matchRow = m;
    }

    let photoUrl: string | null | undefined = undefined;
    const remotePhoto = p.photo_url ? String(p.photo_url).trim() : "";
    if (remotePhoto && /^https?:\/\//i.test(remotePhoto)) {
      try {
        photoUrl = await copyRemotePhotoToSquadStorage(remotePhoto);
      } catch (e) {
        skipped.push({
          full_name: fullName,
          reason: `Foto kopyalanamadı: ${e instanceof Error ? e.message : "hata"}`,
        });
        // devam: foto olmadan diğer alanlar yazılır
        photoUrl = undefined;
      }
    } else if (p.photo_url === null) {
      photoUrl = null;
    }

    const now = new Date().toISOString();

    if (matchRow) {
      syncedSquadIds.add(matchRow.id);
      const patch: Record<string, unknown> = {
        name: fullName,
        shirt_number: shirt,
        position,
        position_category: positionCategory,
        season,
        sort_order: sortOrder,
        is_captain: isCaptain,
        is_active: isActive,
        updated_at: now,
      };
      if (opId) patch.optaport_player_id = opId;
      if (photoUrl !== undefined) patch.photo_url = photoUrl;
      if (bio !== undefined) patch.bio = bio;

      const { error: upErr } = await svc.from("squad").update(patch).eq("id", matchRow.id);
      if (upErr) {
        skipped.push({ full_name: fullName, reason: upErr.message });
        syncedSquadIds.delete(matchRow.id);
        continue;
      }
      updated.push({
        squad_id: matchRow.id,
        name: fullName,
        optaport_player_id: opId ?? matchRow.optaport_player_id,
      });
      continue;
    }

    // Insert new season row
    if (!opId) {
      skipped.push({ full_name: fullName, reason: "Yeni oyuncu için optaport_player_id gerekli." });
      continue;
    }

    const insertRow: Record<string, unknown> = {
      name: fullName,
      shirt_number: shirt,
      position,
      position_category: positionCategory,
      season,
      sort_order: sortOrder,
      is_captain: isCaptain,
      is_active: isActive,
      optaport_player_id: opId,
      photo_url: photoUrl ?? null,
      bio: bio ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data: inserted, error: insErr } = await svc
      .from("squad")
      .insert(insertRow)
      .select("id")
      .single();

    if (insErr) {
      // Unique optaport_player_id conflict: update that row's season fields instead
      if (insErr.message?.includes("optaport_player_id") || insErr.code === "23505") {
        const existing = byOptaportId.get(opId);
        if (existing) {
          const patch: Record<string, unknown> = {
            name: fullName,
            shirt_number: shirt,
            position,
            position_category: positionCategory,
            season,
            sort_order: sortOrder,
            is_captain: isCaptain,
            is_active: isActive,
            updated_at: now,
          };
          if (photoUrl !== undefined) patch.photo_url = photoUrl;
          if (bio !== undefined) patch.bio = bio;
          const { error: upErr } = await svc.from("squad").update(patch).eq("id", existing.id);
          if (upErr) {
            skipped.push({ full_name: fullName, reason: upErr.message });
            continue;
          }
          syncedSquadIds.add(existing.id);
          updated.push({ squad_id: existing.id, name: fullName, optaport_player_id: opId });
          continue;
        }
      }
      skipped.push({ full_name: fullName, reason: insErr.message });
      continue;
    }

    const newId = (inserted as { id: string }).id;
    syncedSquadIds.add(newId);
    created.push({ squad_id: newId, name: fullName, optaport_player_id: opId });
  }

  // Sezon kadrosunda olup payload'da olmayan aktif satırları pasifleştir (silme yok — maç FK)
  const deactivate: { squad_id: string; name: string }[] = [];
  for (const r of allRows) {
    if (!seasonLabelsMatch(r.season, season)) continue;
    if (!r.is_active) continue;
    if (syncedSquadIds.has(r.id)) continue;
    const { error } = await svc
      .from("squad")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", r.id);
    if (!error) deactivate.push({ squad_id: r.id, name: r.name });
  }

  return NextResponse.json({
    success: true,
    season,
    sync_mode: body.sync_mode || "upsert_season",
    created,
    updated,
    deactivated: deactivate,
    skipped,
    counts: {
      created: created.length,
      updated: updated.length,
      deactivated: deactivate.length,
      skipped: skipped.length,
      incoming: rawPlayers.length,
    },
  });
}
