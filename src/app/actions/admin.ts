"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { matchEndAtIso } from "@/lib/match-schedule";
import { seasonLabelFromMatchDate } from "@/lib/seasons";

async function supabase() {
  return getAdminSupabase();
}

/** Maç yazma işlemleri RLS bypass (service role) ile yapılır; böylece policy hatası oluşmaz. */
function matchesClient() {
  return createServiceRoleClient();
}

// ——— Maçlar ———
function parseMatchGoals(formData: FormData): { minute: number; scorer_squad_id: string; assist_squad_id: string | null }[] {
  const minutes = formData.getAll("goal_minute").map((v) => parseInt(String(v), 10));
  const scorers = formData.getAll("goal_scorer") as string[];
  const assists = formData.getAll("goal_assist") as string[];
  const goals: { minute: number; scorer_squad_id: string; assist_squad_id: string | null }[] = [];
  for (let i = 0; i < Math.min(minutes.length, scorers.length); i++) {
    if (!Number.isNaN(minutes[i]) && scorers[i]?.trim()) {
      goals.push({
        minute: minutes[i],
        scorer_squad_id: scorers[i].trim(),
        assist_squad_id: assists[i]?.trim() || null,
      });
    }
  }
  return goals;
}

function parseMatchLineup(formData: FormData): { starters: string[]; substitutes: string[] } {
  const starters = (formData.getAll("starter") as string[]).filter((id) => id?.trim());
  const substitutes = (formData.getAll("substitute") as string[]).filter((id) => id?.trim());
  return { starters, substitutes };
}

function parseMotmCandidates(formData: FormData): string[] {
  return [...new Set((formData.getAll("motm_candidate") as string[]).map((x) => String(x).trim()).filter(Boolean))];
}

function parseMotmVoteTimes(formData: FormData): { starts: string | null; ends: string | null } {
  const rawS = (formData.get("motm_vote_starts_at") as string)?.trim() || "";
  const rawE = (formData.get("motm_vote_ends_at") as string)?.trim() || "";
  const toIso = (raw: string): string | null => {
    if (!raw) return null;
    const t = new Date(raw).getTime();
    if (Number.isNaN(t)) return null;
    return new Date(t).toISOString();
  };
  return { starts: toIso(rawS), ends: toIso(rawE) };
}

async function replaceMatchMotmCandidates(
  s: ReturnType<typeof createServiceRoleClient>,
  matchId: string,
  candidateIds: string[],
  lineupIds: Set<string>
): Promise<{ ok: true } | { error: string }> {
  for (const c of candidateIds) {
    if (!lineupIds.has(c)) return { error: "Oylama adayları yalnızca bu maçın kadrosundan (ilk 11 + yedek) seçilebilir." };
  }
  const { data: votes } = await s.from("match_motm_votes").select("squad_member_id").eq("match_id", matchId);
  for (const v of votes ?? []) {
    const sid = (v as { squad_member_id: string }).squad_member_id;
    if (!candidateIds.includes(sid)) {
      return {
        error:
          "Bu maçta verilmiş oylar var; aday listesinden oyu olan bir oyuncuyu çıkaramazsınız. Önce aynı adayları koruyun veya oylamayı kullanmadan önce adayları düzenleyin.",
      };
    }
  }
  await s.from("match_motm_candidates").delete().eq("match_id", matchId);
  if (candidateIds.length > 0) {
    const { error } = await s
      .from("match_motm_candidates")
      .insert(candidateIds.map((squad_member_id) => ({ match_id: matchId, squad_member_id })));
    if (error) return { error: error.message };
  }
  return { ok: true };
}

export async function createMatch(formData: FormData) {
  const s = matchesClient();
  const manOfTheMatch = (formData.get("man_of_the_match_id") as string)?.trim() || null;
  const { starts: motm_vote_starts_at, ends: motm_vote_ends_at } = parseMotmVoteTimes(formData);
  const candidateIds = parseMotmCandidates(formData);
  const { starters, substitutes } = parseMatchLineup(formData);
  const lineupSet = new Set([...starters, ...substitutes]);

  if (candidateIds.length > 5) {
    return { error: "Taraftar oylamasında en fazla 5 aday seçilebilir." };
  }
  if ((motm_vote_starts_at && !motm_vote_ends_at) || (!motm_vote_starts_at && motm_vote_ends_at)) {
    return { error: "Taraftar oylaması için hem başlangıç hem bitiş saati girin veya ikisini de boş bırakın." };
  }
  if (motm_vote_starts_at && motm_vote_ends_at) {
    if (new Date(motm_vote_ends_at).getTime() <= new Date(motm_vote_starts_at).getTime()) {
      return { error: "Oylama bitiş saati, başlangıçtan sonra olmalıdır." };
    }
  }
  if ((motm_vote_starts_at || motm_vote_ends_at) && candidateIds.length === 0) {
    return { error: "Oylama tarihleri doluysa en az bir aday oyuncu seçin (kadrodan)." };
  }
  if (candidateIds.length > 0 && (!motm_vote_starts_at || !motm_vote_ends_at)) {
    return { error: "Oylama adayı seçtiyseniz başlangıç ve bitiş saatlerini de girin." };
  }

  const matchDateStr = formData.get("match_date") as string;
  const matchTimeStr = (formData.get("match_time") as string)?.trim() || null;
  const match_end_at = matchEndAtIso(matchDateStr, matchTimeStr);
  const seasonValue = (formData.get("season") as string)?.trim();
  if (!seasonValue) return { error: "Sezon seçimi zorunludur." };

  const { data: match, error: matchErr } = await s
    .from("matches")
    .insert({
      opponent_name: (formData.get("opponent_name") as string)?.trim(),
      home_away: formData.get("home_away") as "home" | "away",
      venue: (formData.get("venue") as string)?.trim() || null,
      match_date: matchDateStr,
      match_time: matchTimeStr,
      opponent_logo_url: (formData.get("opponent_logo_url") as string)?.trim() || null,
      competition: (formData.get("competition") as string)?.trim() || null,
      season: seasonValue,
      goals_for: formData.get("goals_for") ? parseInt(formData.get("goals_for") as string, 10) : null,
      goals_against: formData.get("goals_against") ? parseInt(formData.get("goals_against") as string, 10) : null,
      status: (formData.get("status") as string) || "scheduled",
      man_of_the_match_id: manOfTheMatch || null,
      motm_vote_starts_at,
      motm_vote_ends_at,
      match_end_at,
    })
    .select("id")
    .single();
  if (matchErr || !match?.id) return { error: matchErr?.message ?? "Maç eklenemedi." };

  const goals = parseMatchGoals(formData);
  if (goals.length > 0) {
    await s.from("match_goals").insert(goals.map((g) => ({ ...g, match_id: match.id })));
  }
  const lineupRows: { match_id: string; squad_member_id: string; role: "starter" | "substitute"; sort_order: number }[] = [];
  starters.forEach((id, i) => lineupRows.push({ match_id: match.id, squad_member_id: id, role: "starter", sort_order: i }));
  substitutes.forEach((id, i) => lineupRows.push({ match_id: match.id, squad_member_id: id, role: "substitute", sort_order: i }));
  if (lineupRows.length > 0) {
    await s.from("match_lineups").insert(lineupRows);
  }

  const candRes = await replaceMatchMotmCandidates(s, match.id, candidateIds, lineupSet);
  if ("error" in candRes) {
    await s.from("match_goals").delete().eq("match_id", match.id);
    await s.from("match_lineups").delete().eq("match_id", match.id);
    await s.from("matches").delete().eq("id", match.id);
    return { error: candRes.error };
  }

  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  revalidatePath("/kadro");
  revalidatePath("/");
  return { ok: true };
}

export async function updateMatch(id: string, formData: FormData) {
  const s = matchesClient();
  const manOfTheMatch = (formData.get("man_of_the_match_id") as string)?.trim() || null;
  const { starts: motm_vote_starts_at, ends: motm_vote_ends_at } = parseMotmVoteTimes(formData);
  const candidateIds = parseMotmCandidates(formData);
  const { starters, substitutes } = parseMatchLineup(formData);
  const lineupSet = new Set([...starters, ...substitutes]);

  if (candidateIds.length > 5) {
    return { error: "Taraftar oylamasında en fazla 5 aday seçilebilir." };
  }
  if ((motm_vote_starts_at && !motm_vote_ends_at) || (!motm_vote_starts_at && motm_vote_ends_at)) {
    return { error: "Taraftar oylaması için hem başlangıç hem bitiş saati girin veya ikisini de boş bırakın." };
  }
  if (motm_vote_starts_at && motm_vote_ends_at) {
    if (new Date(motm_vote_ends_at).getTime() <= new Date(motm_vote_starts_at).getTime()) {
      return { error: "Oylama bitiş saati, başlangıçtan sonra olmalıdır." };
    }
  }
  if ((motm_vote_starts_at || motm_vote_ends_at) && candidateIds.length === 0) {
    return { error: "Oylama tarihleri doluysa en az bir aday oyuncu seçin (kadrodan)." };
  }
  if (candidateIds.length > 0 && (!motm_vote_starts_at || !motm_vote_ends_at)) {
    return { error: "Oylama adayı seçtiyseniz başlangıç ve bitiş saatlerini de girin." };
  }

  const updMatchDate = formData.get("match_date") as string;
  const updMatchTime = (formData.get("match_time") as string)?.trim() || null;
  const updMatchEndAt = matchEndAtIso(updMatchDate, updMatchTime);
  const updSeason = (formData.get("season") as string)?.trim();
  if (!updSeason) return { error: "Sezon seçimi zorunludur." };

  const { error } = await s
    .from("matches")
    .update({
      opponent_name: (formData.get("opponent_name") as string)?.trim(),
      home_away: formData.get("home_away") as "home" | "away",
      venue: (formData.get("venue") as string)?.trim() || null,
      match_date: updMatchDate,
      match_time: updMatchTime,
      opponent_logo_url: (formData.get("opponent_logo_url") as string)?.trim() || null,
      competition: (formData.get("competition") as string)?.trim() || null,
      season: updSeason,
      goals_for: formData.get("goals_for") ? parseInt(formData.get("goals_for") as string, 10) : null,
      goals_against: formData.get("goals_against") ? parseInt(formData.get("goals_against") as string, 10) : null,
      status: (formData.get("status") as string) || "scheduled",
      man_of_the_match_id: manOfTheMatch || null,
      motm_vote_starts_at,
      motm_vote_ends_at,
      match_end_at: updMatchEndAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  await s.from("match_goals").delete().eq("match_id", id);
  await s.from("match_lineups").delete().eq("match_id", id);

  const goals = parseMatchGoals(formData);
  if (goals.length > 0) {
    await s.from("match_goals").insert(goals.map((g) => ({ ...g, match_id: id })));
  }
  const lineupRows: { match_id: string; squad_member_id: string; role: "starter" | "substitute"; sort_order: number }[] = [];
  starters.forEach((sid, i) => lineupRows.push({ match_id: id, squad_member_id: sid, role: "starter", sort_order: i }));
  substitutes.forEach((sid, i) => lineupRows.push({ match_id: id, squad_member_id: sid, role: "substitute", sort_order: i }));
  if (lineupRows.length > 0) {
    await s.from("match_lineups").insert(lineupRows);
  }

  const candRes = await replaceMatchMotmCandidates(s, id, candidateIds, lineupSet);
  if ("error" in candRes) return { error: candRes.error };

  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  revalidatePath(`/maclar/${id}`);
  revalidatePath("/kadro");
  revalidatePath("/");
  return { ok: true };
}

/** Haftanın oyuncusu duyurusu + maçın resmi MOTM (favori barem sayımı). */
export async function createWeekPlayerAward(formData: FormData) {
  const s = matchesClient();
  const season = (formData.get("season") as string)?.trim();
  const weekRaw = formData.get("week_number");
  const matchId = (formData.get("match_id") as string)?.trim() || null;
  const squadId = (formData.get("squad_id") as string)?.trim();
  const week_number = parseInt(String(weekRaw), 10);
  if (!season) return { error: "Sezon gerekli." };
  if (!squadId) return { error: "Oyuncu seçin." };
  if (Number.isNaN(week_number) || week_number < 1 || week_number > 53) return { error: "Hafta 1–53 arası olmalıdır." };

  const { error: insErr } = await s.from("week_player_awards").insert({
    season,
    week_number,
    match_id: matchId,
    squad_id: squadId,
  });
  if (insErr) {
    if (insErr.code === "23505") return { error: "Bu sezon ve hafta için kayıt zaten var." };
    return { error: insErr.message };
  }
  if (matchId) {
    await s
      .from("matches")
      .update({ man_of_the_match_id: squadId, updated_at: new Date().toISOString() })
      .eq("id", matchId);
  }
  revalidatePath("/");
  revalidatePath("/admin/maclar");
  revalidatePath("/admin/maclar/haftanin-oyuncusu");
  return { ok: true };
}

/** Form action: void dönüş (redirect) — Haftanın oyuncusu sayfası */
export async function submitWeekPlayerAwardForm(formData: FormData) {
  const res = await createWeekPlayerAward(formData);
  if ("error" in res && res.error) {
    redirect(`/admin/maclar/haftanin-oyuncusu?err=${encodeURIComponent(res.error)}`);
  }
  redirect("/admin/maclar/haftanin-oyuncusu?ok=1");
}

export async function deleteMatch(id: string) {
  const s = matchesClient();
  const { error } = await s.from("matches").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  revalidatePath("/");
  return { ok: true };
}

/** Mackolik fikstüründen maçları veritabanına aktarır. Aynı tarih + rakip olan kayıt varsa atlanır. Tarih ve skorla bitmiş/gelecek otomatik belirlenir. */
export async function importMackolikMatches(): Promise<{ ok: true; imported: number; skipped: number } | { error: string }> {
  const { getMackolikFixtureUrl } = await import("@/lib/data");
  const { getMackolikMatches } = await import("@/lib/mackolik");
  const url = await getMackolikFixtureUrl();
  const list = await getMackolikMatches(url);
  if (list.length === 0) return { ok: true, imported: 0, skipped: 0 };

  const s = matchesClient();
  const GUNGOREN_NAMES = /güngören|gungoren|güngören bld/i;
  const todayStr = new Date().toISOString().slice(0, 10);
  let imported = 0;
  let skipped = 0;

  for (const m of list) {
    const isHome = GUNGOREN_NAMES.test(m.home);
    const opponent_name = isHome ? m.away : m.home;
    const match_date = m.date;
    const goals_for = m.goalsHome != null && m.goalsAway != null ? (isHome ? m.goalsHome : m.goalsAway) : null;
    const goals_against = m.goalsHome != null && m.goalsAway != null ? (isHome ? m.goalsAway : m.goalsHome) : null;
    const hasScore = goals_for != null && goals_against != null;
    const isPast = match_date < todayStr;
    const status = hasScore || isPast ? "finished" : "scheduled";
    const competition = (m.competition && m.competition.trim()) ? m.competition.trim() : null;
    const season = seasonLabelFromMatchDate(match_date);

    const { data: existing } = await s
      .from("matches")
      .select("id")
      .eq("match_date", match_date)
      .eq("opponent_name", opponent_name)
      .eq("home_away", isHome ? "home" : "away")
      .maybeSingle();
    if (existing) {
      skipped++;
      continue;
    }

    const importedEndAt = matchEndAtIso(match_date, null);
    const { error } = await s.from("matches").insert({
      opponent_name,
      home_away: isHome ? "home" : "away",
      venue: null,
      match_date,
      match_time: null,
      opponent_logo_url: null,
      competition,
      season,
      goals_for,
      goals_against,
      status,
      match_end_at: importedEndAt,
    });
    if (!error) imported++;
  }

  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  return { ok: true, imported, skipped };
}

// ——— Kadro ———
export async function createSquadMember(formData: FormData) {
  const s = await supabase();
  const shirt_number = formData.get("shirt_number");
  const { error } = await s.from("squad").insert({
    name: (formData.get("name") as string)?.trim(),
    shirt_number: shirt_number ? parseInt(shirt_number as string, 10) : null,
    position: (formData.get("position") as string)?.trim() || null,
    position_category: (formData.get("position_category") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    bio: (formData.get("bio") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
    is_captain: formData.get("is_captain") === "on",
    season: (formData.get("season") as string)?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/kadro");
  revalidatePath("/kadro");
  return { ok: true };
}

export async function updateSquadMember(id: string, formData: FormData) {
  const s = await supabase();
  const shirt_number = formData.get("shirt_number");
  const { error } = await s.from("squad").update({
    name: (formData.get("name") as string)?.trim(),
    shirt_number: shirt_number ? parseInt(shirt_number as string, 10) : null,
    position: (formData.get("position") as string)?.trim() || null,
    position_category: (formData.get("position_category") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    bio: (formData.get("bio") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
    is_captain: formData.get("is_captain") === "on",
    season: (formData.get("season") as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/kadro");
  revalidatePath("/kadro");
  return { ok: true };
}

export async function deleteSquadMember(id: string) {
  const s = await supabase();
  const { error } = await s.from("squad").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/kadro");
  revalidatePath("/kadro");
  return { ok: true };
}

// ——— Etkinlikler (news) ———
export async function createNews(formData: FormData) {
  const s = await supabase();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Etkinlik başlığı zorunludur." };
  const slug = (formData.get("slug") as string)?.trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const eventDate = (formData.get("event_date") as string)?.trim() || null;
  const eventEndDate = (formData.get("event_end_date") as string)?.trim() || null;
  const capacityVal = formData.get("capacity");
  const rawPublished = (formData.get("published_at") as string)?.trim() || null;
  const published_at =
    rawPublished ||
    (eventDate ? `${eventDate}T12:00:00.000Z` : null) ||
    new Date().toISOString();
  const { error } = await s.from("news").insert({
    title,
    slug,
    excerpt: (formData.get("excerpt") as string)?.trim() || null,
    body: (formData.get("body") as string)?.trim() || null,
    published_at,
    image_url: (formData.get("image_url") as string)?.trim() || null,
    event_date: eventDate || null,
    event_end_date: eventEndDate || null,
    event_time: (formData.get("event_time") as string)?.trim() || null,
    event_place: (formData.get("event_place") as string)?.trim() || null,
    event_type: (formData.get("event_type") as string)?.trim() || null,
    capacity: capacityVal ? parseInt(capacityVal as string, 10) : null,
    registration_url: (formData.get("registration_url") as string)?.trim() || null,
    is_online: formData.get("is_online") === "on",
    is_ticketed: formData.get("is_ticketed") === "on",
    external_link: (formData.get("external_link") as string)?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/haberler");
  revalidatePath("/haberler");
  return { ok: true };
}

export async function updateNews(id: string, formData: FormData) {
  const s = await supabase();
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || title?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const eventDate = (formData.get("event_date") as string)?.trim() || null;
  const eventEndDate = (formData.get("event_end_date") as string)?.trim() || null;
  const capacityVal = formData.get("capacity");
  const rawPublished = (formData.get("published_at") as string)?.trim() || null;
  const published_at =
    rawPublished ||
    (eventDate ? `${eventDate}T12:00:00.000Z` : null) ||
    new Date().toISOString();
  const { error } = await s.from("news").update({
    title,
    slug,
    excerpt: (formData.get("excerpt") as string)?.trim() || null,
    body: (formData.get("body") as string)?.trim() || null,
    published_at,
    image_url: (formData.get("image_url") as string)?.trim() || null,
    event_date: eventDate || null,
    event_end_date: eventEndDate || null,
    event_time: (formData.get("event_time") as string)?.trim() || null,
    event_place: (formData.get("event_place") as string)?.trim() || null,
    event_type: (formData.get("event_type") as string)?.trim() || null,
    capacity: capacityVal ? parseInt(capacityVal as string, 10) : null,
    registration_url: (formData.get("registration_url") as string)?.trim() || null,
    is_online: formData.get("is_online") === "on",
    is_ticketed: formData.get("is_ticketed") === "on",
    external_link: (formData.get("external_link") as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/haberler");
  revalidatePath("/haberler");
  revalidatePath(`/haberler/${slug}`);
  return { ok: true };
}

export async function deleteNews(id: string) {
  const s = await supabase();
  const { error } = await s.from("news").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/haberler");
  revalidatePath("/haberler");
  return { ok: true };
}

// ——— Yönetim Kurulu ———
export async function createBoardMember(formData: FormData) {
  const s = await supabase();
  const roleSlug = (formData.get("role_slug") as string)?.trim() || null;
  const roleCustom = (formData.get("role_custom") as string)?.trim() || null;
  const { error } = await s.from("board_members").insert({
    name: (formData.get("name") as string)?.trim(),
    role_slug: roleSlug || null,
    role_description: (formData.get("role_description") as string)?.trim() || null,
    role_custom: roleCustom || null,
    biography: (formData.get("biography") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/yonetim-kurulu");
  revalidatePath("/kulup/yonetim-kurulu");
  return { ok: true };
}

export async function updateBoardMember(id: string, formData: FormData) {
  const s = await supabase();
  const roleSlug = (formData.get("role_slug") as string)?.trim() || null;
  const roleCustom = (formData.get("role_custom") as string)?.trim() || null;
  const { error } = await s.from("board_members").update({
    name: (formData.get("name") as string)?.trim(),
    role_slug: roleSlug || null,
    role_description: (formData.get("role_description") as string)?.trim() || null,
    role_custom: roleCustom || null,
    biography: (formData.get("biography") as string)?.trim() || null,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/yonetim-kurulu");
  revalidatePath("/kulup/yonetim-kurulu");
  return { ok: true };
}

export async function deleteBoardMember(id: string) {
  const s = await supabase();
  const { error } = await s.from("board_members").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/yonetim-kurulu");
  revalidatePath("/kulup/yonetim-kurulu");
  return { ok: true };
}

// ——— Tarihi ve Kupa Müzesi ———
export async function createTrophy(formData: FormData) {
  const s = await supabase();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Kupa ismi zorunludur." };
  const year = parseInt((formData.get("year") as string) || "0", 10);
  const { error } = await s.from("club_trophies").insert({
    name,
    year,
    image_url: (formData.get("image_url") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
    is_alt_yapi: formData.get("is_alt_yapi") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/kupa-muzesi");
  revalidatePath("/kulup");
  return { ok: true };
}

export async function updateTrophy(id: string, formData: FormData) {
  const s = await supabase();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Kupa ismi zorunludur." };
  const year = parseInt((formData.get("year") as string) || "0", 10);
  const { error } = await s.from("club_trophies").update({
    name,
    year,
    image_url: (formData.get("image_url") as string)?.trim() || null,
    description: (formData.get("description") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
    is_alt_yapi: formData.get("is_alt_yapi") === "on",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/kupa-muzesi");
  revalidatePath("/kulup");
  return { ok: true };
}

export async function deleteTrophy(id: string) {
  const s = await supabase();
  const { error } = await s.from("club_trophies").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/kupa-muzesi");
  revalidatePath("/kulup");
  return { ok: true };
}

/** Kulüp sayfası Hakkımızda metnini günceller. */
export async function updateClubAbout(formData: FormData) {
  const s = await supabase();
  const content = (formData.get("content") as string)?.trim() ?? "";
  const { error } = await s.from("club_about").update({ content, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/admin/kupa-muzesi");
  revalidatePath("/kulup");
  return { ok: true };
}

// ——— Teknik Heyet ———
export async function createTechnicalStaff(formData: FormData) {
  const s = await supabase();
  const { error } = await s.from("technical_staff").insert({
    name: (formData.get("name") as string)?.trim(),
    role_slug: formData.get("role_slug") as string,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/teknik-heyet");
  revalidatePath("/kulup/teknik-heyet");
  return { ok: true };
}

export async function updateTechnicalStaff(id: string, formData: FormData) {
  const s = await supabase();
  const { error } = await s.from("technical_staff").update({
    name: (formData.get("name") as string)?.trim(),
    role_slug: formData.get("role_slug") as string,
    photo_url: (formData.get("photo_url") as string)?.trim() || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    is_active: formData.get("is_active") === "on",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/teknik-heyet");
  revalidatePath("/kulup/teknik-heyet");
  return { ok: true };
}

export async function deleteTechnicalStaff(id: string) {
  const s = await supabase();
  const { error } = await s.from("technical_staff").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/teknik-heyet");
  revalidatePath("/kulup/teknik-heyet");
  return { ok: true };
}

// ——— Galeriler ———
export async function createGallery(formData: FormData) {
  const s = await supabase();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Galeri başlığı zorunludur." };
  const slug = (formData.get("slug") as string)?.trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const event_date = (formData.get("event_date") as string) || null;
  const { data, error } = await s.from("galleries").insert({ title, slug, event_date: event_date || null }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/admin/galeriler");
  revalidatePath("/galeri");
  return { ok: true, id: data?.id };
}

export async function updateGallery(id: string, formData: FormData) {
  const s = await supabase();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return { error: "Galeri başlığı zorunludur." };
  const slug = (formData.get("slug") as string)?.trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const event_date = (formData.get("event_date") as string) || null;
  const { error } = await s.from("galleries").update({ title, slug, event_date: event_date || null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeriler");
  revalidatePath("/galeri");
  revalidatePath(`/galeri/${slug}`);
  return { ok: true };
}

export async function addGalleryPhoto(galleryId: string, formData: FormData) {
  const s = await supabase();
  const image_url = (formData.get("image_url") as string)?.trim();
  if (!image_url) return { error: "Fotoğraf URL zorunludur." };
  const caption = (formData.get("caption") as string)?.trim() || null;
  const { data: max } = await s.from("gallery_photos").select("sort_order").eq("gallery_id", galleryId).order("sort_order", { ascending: false }).limit(1).single();
  const sort_order = (max?.sort_order ?? -1) + 1;
  const { error } = await s.from("gallery_photos").insert({ gallery_id: galleryId, image_url, caption, sort_order });
  if (error) return { error: error.message };
  revalidatePath("/admin/galeriler");
  revalidatePath("/galeri");
  return { ok: true };
}

export async function updateGalleryPhoto(photoId: string, formData: FormData) {
  const s = await supabase();
  const caption = (formData.get("caption") as string)?.trim() || null;
  const sort_order = parseInt((formData.get("sort_order") as string) ?? "0", 10);
  const { error } = await s.from("gallery_photos").update({ caption, sort_order }).eq("id", photoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeriler");
  revalidatePath("/galeri");
  return { ok: true };
}

export async function deleteGalleryPhoto(photoId: string) {
  const s = await supabase();
  const { error } = await s.from("gallery_photos").delete().eq("id", photoId);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeriler");
  revalidatePath("/galeri");
  return { ok: true };
}

export async function deleteGallery(id: string) {
  const s = await supabase();
  const { error } = await s.from("galleries").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/galeriler");
  revalidatePath("/galeri");
  return { ok: true };
}

// ——— Transferler ———
export async function createTransfer(formData: FormData) {
  const s = await supabase();
  const player_name = (formData.get("player_name") as string)?.trim();
  if (!player_name) return { error: "Oyuncu adı zorunludur." };
  const direction = (formData.get("direction") as string) === "outgoing" ? "outgoing" : "incoming";
  const ageVal = formData.get("age");
  const { data, error } = await s.from("transfers").insert({
    player_name,
    player_image_url: (formData.get("player_image_url") as string)?.trim() || null,
    position: (formData.get("position") as string)?.trim() || null,
    age: ageVal !== null && ageVal !== "" ? parseInt(String(ageVal), 10) : null,
    from_team_name: (formData.get("from_team_name") as string)?.trim() || "",
    from_team_league: (formData.get("from_team_league") as string)?.trim() || null,
    to_team_name: (formData.get("to_team_name") as string)?.trim() || "",
    to_team_league: (formData.get("to_team_league") as string)?.trim() || null,
    transfer_date: (formData.get("transfer_date") as string) || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    direction,
    updated_at: new Date().toISOString(),
  }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/admin/transferler");
  revalidatePath("/transferler");
  return { ok: true, id: data?.id };
}

export async function updateTransfer(id: string, formData: FormData) {
  const s = await supabase();
  const player_name = (formData.get("player_name") as string)?.trim();
  if (!player_name) return { error: "Oyuncu adı zorunludur." };
  const direction = (formData.get("direction") as string) === "outgoing" ? "outgoing" : "incoming";
  const ageVal = formData.get("age");
  const { error } = await s.from("transfers").update({
    player_name,
    player_image_url: (formData.get("player_image_url") as string)?.trim() || null,
    position: (formData.get("position") as string)?.trim() || null,
    age: ageVal !== null && ageVal !== "" ? parseInt(String(ageVal), 10) : null,
    from_team_name: (formData.get("from_team_name") as string)?.trim() || "",
    from_team_league: (formData.get("from_team_league") as string)?.trim() || null,
    to_team_name: (formData.get("to_team_name") as string)?.trim() || "",
    to_team_league: (formData.get("to_team_league") as string)?.trim() || null,
    transfer_date: (formData.get("transfer_date") as string) || null,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    direction,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/transferler");
  revalidatePath("/transferler");
  return { ok: true };
}

export async function deleteTransfer(id: string) {
  const s = await supabase();
  const { error } = await s.from("transfers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/transferler");
  revalidatePath("/transferler");
  return { ok: true };
}

export async function addTransferSeasonStat(transferId: string, formData: FormData) {
  const s = await supabase();
  const { error } = await s.from("transfer_season_stats").insert({
    transfer_id: transferId,
    season_label: (formData.get("season_label") as string)?.trim() || "",
    matches_played: parseInt((formData.get("matches_played") as string) || "0", 10),
    goals: parseInt((formData.get("goals") as string) || "0", 10),
    assists: parseInt((formData.get("assists") as string) || "0", 10),
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/transferler");
  revalidatePath("/transferler");
  return { ok: true };
}

export async function updateTransferSeasonStat(statId: string, formData: FormData) {
  const s = await supabase();
  const { error } = await s.from("transfer_season_stats").update({
    season_label: (formData.get("season_label") as string)?.trim() || "",
    matches_played: parseInt((formData.get("matches_played") as string) || "0", 10),
    goals: parseInt((formData.get("goals") as string) || "0", 10),
    assists: parseInt((formData.get("assists") as string) || "0", 10),
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  }).eq("id", statId);
  if (error) return { error: error.message };
  revalidatePath("/admin/transferler");
  revalidatePath("/transferler");
  return { ok: true };
}

export async function deleteTransferSeasonStat(statId: string) {
  const s = await supabase();
  const { error } = await s.from("transfer_season_stats").delete().eq("id", statId);
  if (error) return { error: error.message };
  revalidatePath("/admin/transferler");
  revalidatePath("/transferler");
  return { ok: true };
}

// ——— Öne çıkan (homepage_featured) ———
const FEATURED_MAX = 5;

export async function createHomepageFeatured(formData: FormData) {
  const s = await supabase();
  const { count } = await s.from("homepage_featured").select("*", { count: "exact", head: true });
  if ((count ?? 0) >= FEATURED_MAX) return { error: `En fazla ${FEATURED_MAX} modül eklenebilir.` };
  const module_key = (formData.get("module_key") as string)?.trim();
  if (!module_key) return { error: "Modül seçin." };
  const image_url = (formData.get("image_url") as string)?.trim();
  if (!image_url) return { error: "Görsel URL zorunludur." };
  const { data: maxOrder } = await s.from("homepage_featured").select("sort_order").order("sort_order", { ascending: false }).limit(1).single();
  const sort_order = (maxOrder?.sort_order ?? -1) + 1;
  const { error } = await s.from("homepage_featured").insert({
    module_key,
    title: (formData.get("title") as string)?.trim() || null,
    subtitle: (formData.get("subtitle") as string)?.trim() || null,
    image_url,
    link: (formData.get("link") as string)?.trim() || null,
    is_large: formData.get("is_large") === "on",
    sort_order,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/one-cikan");
  revalidatePath("/");
  return { ok: true };
}

export async function updateHomepageFeatured(id: string, formData: FormData) {
  const s = await supabase();
  const is_large = formData.get("is_large") === "on";
  if (is_large) {
    await s.from("homepage_featured").update({ is_large: false }).neq("id", id);
  }
  const { error } = await s.from("homepage_featured").update({
    title: (formData.get("title") as string)?.trim() || null,
    subtitle: (formData.get("subtitle") as string)?.trim() || null,
    image_url: (formData.get("image_url") as string)?.trim() || "",
    link: (formData.get("link") as string)?.trim() || null,
    is_large,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/one-cikan");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteHomepageFeatured(id: string) {
  const s = await supabase();
  const { error } = await s.from("homepage_featured").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/one-cikan");
  revalidatePath("/");
  return { ok: true };
}

export async function reorderHomepageFeatured(orderedIds: string[]) {
  const s = await supabase();
  for (let i = 0; i < orderedIds.length; i++) {
    await s.from("homepage_featured").update({ sort_order: i, updated_at: new Date().toISOString() }).eq("id", orderedIds[i]);
  }
  revalidatePath("/admin/one-cikan");
  revalidatePath("/");
  return { ok: true };
}

export async function moveHomepageFeatured(id: string, direction: "up" | "down") {
  const s = await supabase();
  const { data: items } = await s.from("homepage_featured").select("id, sort_order").order("sort_order", { ascending: true });
  if (!items || items.length < 2) return { ok: true };
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return { error: "Bulunamadı." };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= items.length) return { ok: true };
  const newOrder = items.slice();
  [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];
  await reorderHomepageFeatured(newOrder.map((i) => i.id));
  return { ok: true };
}

// ——— Rozet (fan_levels) ———
export async function updateFanLevel(id: string, formData: FormData) {
  const s = await supabase();
  const levelId = parseInt(id, 10);
  if (Number.isNaN(levelId)) return { error: "Geçersiz rütbe id" };
  const min_points = formData.get("min_points");
  const target_store = formData.get("target_store_spend");
  const target_tickets = formData.get("target_tickets");
  const target_donation = formData.get("target_donation");
  const advantagesRaw = (formData.get("advantages") as string)?.trim() || null;
  const { error } = await s.from("fan_levels").update({
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim(),
    min_points: min_points != null ? parseInt(min_points as string, 10) : 0,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    description: (formData.get("description") as string)?.trim() || null,
    advantages: advantagesRaw,
    target_store_spend: target_store ? parseFloat(target_store as string) : null,
    target_tickets: target_tickets ? parseInt(target_tickets as string, 10) : null,
    target_donation: target_donation ? parseFloat(target_donation as string) : null,
  }).eq("id", levelId);
  if (error) return { error: error.message };

  // Avantaj modül değerleri: benefit_module_<uuid> = value
  const benefitEntries: { benefit_module_id: string; value: number }[] = [];
  for (const [key, val] of formData.entries()) {
    if (typeof key === "string" && key.startsWith("benefit_module_") && typeof val === "string" && val.trim() !== "") {
      const moduleId = key.slice("benefit_module_".length);
      const num = parseFloat(val.replace(",", "."));
      if (!Number.isNaN(num) && num >= 0) benefitEntries.push({ benefit_module_id: moduleId, value: num });
    }
  }
  await s.from("fan_level_benefits").delete().eq("fan_level_id", levelId);
  if (benefitEntries.length > 0) {
    await s.from("fan_level_benefits").insert(
      benefitEntries.map((e) => ({ fan_level_id: levelId, benefit_module_id: e.benefit_module_id, value: e.value }))
    );
  }

  revalidatePath("/admin/rozet");
  revalidatePath("/admin/avantaj-modulleri");
  revalidatePath("/benim-kosem");
  revalidatePath("/");
  return { ok: true };
}

// ——— Avantaj modülleri (benefit_modules) ———
export async function createBenefitModule(formData: FormData) {
  const s = await supabase();
  const value_type = (formData.get("value_type") as string) || "number";
  if (!["percent", "number", "boolean"].includes(value_type)) return { error: "Geçersiz value_type" };
  const { error } = await s.from("benefit_modules").insert({
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "_"),
    value_type,
    unit_label: (formData.get("unit_label") as string)?.trim() || "",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/avantaj-modulleri");
  revalidatePath("/admin/rozet");
  return { ok: true };
}

export async function updateBenefitModule(id: string, formData: FormData) {
  const s = await supabase();
  const value_type = (formData.get("value_type") as string) || "number";
  if (!["percent", "number", "boolean"].includes(value_type)) return { error: "Geçersiz value_type" };
  const { error } = await s.from("benefit_modules").update({
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "_"),
    value_type,
    unit_label: (formData.get("unit_label") as string)?.trim() || "",
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/avantaj-modulleri");
  revalidatePath("/admin/rozet");
  revalidatePath("/benim-kosem");
  return { ok: true };
}

export async function deleteBenefitModule(id: string) {
  const s = await supabase();
  const { error } = await s.from("fan_level_benefits").delete().eq("benefit_module_id", id);
  if (error) return { error: error.message };
  const { error: err2 } = await s.from("benefit_modules").delete().eq("id", id);
  if (err2) return { error: err2.message };
  revalidatePath("/admin/avantaj-modulleri");
  revalidatePath("/admin/rozet");
  revalidatePath("/benim-kosem");
  return { ok: true };
}

// ——— Site ayarları (kargo) ———
export async function updateShippingSettings(formData: FormData) {
  const s = await supabase();
  const freeShippingThreshold = parseFloat((formData.get("freeShippingThreshold") as string) || "500");
  const standardShippingCost = parseFloat((formData.get("standardShippingCost") as string) || "29.9");
  const estimatedDeliveryDays = (formData.get("estimatedDeliveryDays") as string)?.trim() || "2-3";
  const { error } = await s.from("site_settings").upsert(
    {
      key: "shipping",
      value: { freeShippingThreshold, standardShippingCost, estimatedDeliveryDays },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/ayarlar");
  return { ok: true };
}

// ——— Bağış makbuzu şablonu ———
export async function updateDonationReceiptTemplate(formData: FormData) {
  const s = await supabase();
  const title = (formData.get("receipt_title") as string)?.trim() || "Bağış Makbuzu";
  const body = (formData.get("receipt_body") as string)?.trim() || "";
  const { error } = await s.from("site_settings").upsert(
    {
      key: "donation_receipt_template",
      value: { title, body },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/ayarlar");
  revalidatePath("/bagis/basarili");
  return { ok: true };
}

// ——— Etkinlik pasif (tek etkinlik gizle) ———
export async function setNewsHidden(id: string, isHidden: boolean) {
  const s = await supabase();
  const { error } = await s.from("news").update({ is_hidden: isHidden, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/haberler");
  revalidatePath("/haberler");
  revalidatePath("/biletler");
  return { ok: true };
}

// ——— Maç pasif (tek maç gizle) ———
export async function setMatchHidden(id: string, isHidden: boolean) {
  const s = await supabase();
  const { error } = await s.from("matches").update({ is_hidden: isHidden, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  revalidatePath("/biletler");
  return { ok: true };
}

// ——— Hediye hakkı ürünleri (admin seçer, sadece bunlar hediye ile alınabilir) ———
export async function updateGiftEligibleProducts(productIds: string[]) {
  const s = await supabase();
  const { error } = await s.from("site_settings").upsert(
    { key: "gift_eligible_product_ids", value: productIds, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/ayarlar");
  revalidatePath("/benim-kosem/hediye-kullan");
  return { ok: true };
}

/** Mackolik fikstür sayfası linkini günceller. Link değişince sayfa yapısı aynıysa entegre çalışmaya devam eder. */
export async function updateMackolikFixtureUrl(url: string) {
  const trimmed = (url || "").trim();
  if (!trimmed.startsWith("http")) return { error: "Geçerli bir Mackolik sayfa linki girin." };
  const s = await supabase();
  const { error } = await s.from("site_settings").upsert(
    { key: "mackolik_fixture_url", value: trimmed, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  return { ok: true };
}

const PENDING_DONATION_EXPIRE_DAYS = 3;

/** Bekleyen (PENDING) bağışlar 3 gün içinde ödenmezse sistemden silinir. Bağışlar sayfası yüklenirken çağrılır. */
export async function expireOldPendingDonations(): Promise<{ expired: number }> {
  const s = createServiceRoleClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PENDING_DONATION_EXPIRE_DAYS);
  const cutoffIso = cutoff.toISOString();
  const { data: toDelete } = await s
    .from("donations")
    .select("id")
    .eq("payment_status", "PENDING")
    .lt("created_at", cutoffIso);
  if (!toDelete?.length) return { expired: 0 };
  const { error } = await s.from("donations").delete().in("id", toDelete.map((r) => r.id));
  if (error) return { expired: 0 };
  revalidatePath("/admin/bagislar");
  return { expired: toDelete.length };
}

/** Bağış siler. Ödendi (PAID) statüsündeki kayıtlar silinemez (DB trigger da engeller). */
export async function deleteDonation(id: string): Promise<{ ok: true } | { error: string }> {
  const s = createServiceRoleClient();
  const { data: row, error: fetchErr } = await s.from("donations").select("payment_status").eq("id", id).single();
  if (fetchErr || !row) return { error: "Bağış bulunamadı." };
  if (row.payment_status === "PAID") return { error: "Ödendi statüsündeki bağış silinemez." };
  const { error: delErr } = await s.from("donations").delete().eq("id", id);
  if (delErr) return { error: delErr.message };
  revalidatePath("/admin/bagislar");
  return { ok: true };
}

const PENDING_ORDER_EXPIRE_DAYS = 3;

/** Bekleyen (PENDING ödeme) siparişler 3 gün içinde ödenmezse sistemden silinir. Siparişler sayfası yüklenirken çağrılır. */
export async function expireOldPendingOrders(): Promise<{ expired: number }> {
  const s = createServiceRoleClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - PENDING_ORDER_EXPIRE_DAYS);
  const cutoffIso = cutoff.toISOString();
  const { data: toDelete } = await s
    .from("orders")
    .select("id")
    .eq("payment_status", "PENDING")
    .lt("created_at", cutoffIso);
  if (!toDelete?.length) return { expired: 0 };
  const { error } = await s.from("orders").delete().in("id", toDelete.map((r) => r.id));
  if (error) return { expired: 0 };
  revalidatePath("/admin/siparisler");
  return { expired: toDelete.length };
}

/** Sipariş siler. Ödendi (PAID) statüsündeki siparişler silinemez (DB trigger da engeller). Sadece başarısız vb. silinebilir. */
export async function deleteOrder(id: string): Promise<{ ok: true } | { error: string }> {
  const s = createServiceRoleClient();
  const { data: row, error: fetchErr } = await s.from("orders").select("payment_status").eq("id", id).single();
  if (fetchErr || !row) return { error: "Sipariş bulunamadı." };
  if (row.payment_status === "PAID") return { error: "Ödendi statüsündeki sipariş silinemez." };
  const { error: delErr } = await s.from("orders").delete().eq("id", id);
  if (delErr) return { error: delErr.message };
  revalidatePath("/admin/siparisler");
  return { ok: true };
}

// ——— Hediye Verme (admin: üyeye hediye veya ürün bazlı indirim) ———
function generateGiftQrCode(): string {
  return "GIFT-" + Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).slice(-6).toUpperCase();
}

/** Admin: Üyeye mağaza ürünü hediye verir (QR ile teslim). Ürün ürün, adet kadar kayıt oluşturulur. */
export async function adminGiveGift(
  userId: string,
  productId: string,
  quantity: number
): Promise<{ ok: true; qrCodes: string[] } | { error: string }> {
  const s = createServiceRoleClient();
  const qty = Math.max(1, Math.min(Number(quantity) || 1, 50));
  const { data: product } = await s.from("store_products").select("id, name").eq("id", productId).eq("is_active", true).single();
  if (!product) return { error: "Ürün bulunamadı veya pasif." };
  const year = new Date().getFullYear();
  const rows: { user_id: string; product_id: string; qr_code: string; status: string; redemption_year: number; granted_by_admin: boolean }[] = [];
  const used = new Set<string>();
  for (let i = 0; i < qty; i++) {
    let qr = generateGiftQrCode();
    while (used.has(qr)) qr = generateGiftQrCode();
    used.add(qr);
    rows.push({
      user_id: userId,
      product_id: productId,
      qr_code: qr,
      status: "pending_pickup",
      redemption_year: year,
      granted_by_admin: true,
    });
  }
  const { error } = await s.from("gift_redemptions").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/admin/hediye-verme");
  revalidatePath("/benim-kosem");
  return { ok: true, qrCodes: rows.map((r) => r.qr_code) };
}

/** Admin: Üyeye ürün bazlı indirim atar (ürün ürün). items: { productId, discountPercent }[]; 0 = indirimi kaldır. */
export async function adminSetMemberProductDiscounts(
  userId: string,
  items: { productId: string; discountPercent: number }[]
): Promise<{ ok: true } | { error: string }> {
  const s = createServiceRoleClient();
  const now = new Date().toISOString();
  for (const { productId, discountPercent } of items) {
    const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    if (pct === 0) {
      await s.from("member_product_discounts").delete().eq("user_id", userId).eq("product_id", productId);
    } else {
      await s.from("member_product_discounts").upsert(
        { user_id: userId, product_id: productId, discount_percent: pct, updated_at: now },
        { onConflict: "user_id,product_id" }
      );
    }
  }
  revalidatePath("/admin/hediye-verme");
  revalidatePath("/magaza");
  revalidatePath("/benim-kosem");
  return { ok: true };
}

/** Admin: Seçilen üyenin ürün bazlı indirimlerini döner (ürün id -> yüzde). */
export async function adminGetMemberDiscounts(userId: string): Promise<Record<string, number>> {
  const s = createServiceRoleClient();
  const { data } = await s
    .from("member_product_discounts")
    .select("product_id, discount_percent")
    .eq("user_id", userId);
  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { product_id: string }).product_id;
    out[id] = Math.min(100, Math.max(0, Number((row as { discount_percent: number }).discount_percent)));
  }
  return out;
}
