"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { getAdminSupabase } from "@/app/admin/actions";
import { shuffleUserIdsFair } from "@/lib/motm-lottery";

async function db() {
  return getAdminSupabase();
}

function revalidate() {
  revalidatePath("/admin/maclar/motm-cekilis");
}

async function maybeRevalidateHome(supabase: SupabaseClient, eventId: string) {
  const { data } = await supabase.from("motm_lottery_events").select("show_on_homepage").eq("id", eventId).maybeSingle();
  if ((data as { show_on_homepage?: boolean } | null)?.show_on_homepage) revalidatePath("/");
}

export type MotmLotteryActionResult = { ok: true } | { ok: false; error: string };

export async function createMotmLotteryEvent(formData: FormData): Promise<void> {
  const title = (formData.get("title") as string)?.trim();
  if (!title) redirect(`/admin/maclar/motm-cekilis/yeni?err=${encodeURIComponent("Başlık zorunludur.")}`);
  const description = ((formData.get("description") as string) ?? "").trim() || null;
  const wc = parseInt(String(formData.get("winner_count") ?? "1"), 10);
  if (!Number.isFinite(wc) || wc < 1 || wc > 500) {
    redirect(`/admin/maclar/motm-cekilis/yeni?err=${encodeURIComponent("Talihli sayısı 1–500 arasında olmalıdır.")}`);
  }

  const supabase = await db();
  const { data, error } = await supabase
    .from("motm_lottery_events")
    .insert({
      title,
      description,
      winner_count: wc,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) redirect(`/admin/maclar/motm-cekilis/yeni?err=${encodeURIComponent(error.message)}`);
  revalidate();
  redirect(`/admin/maclar/motm-cekilis/${(data as { id: string }).id}`);
}

export async function updateMotmLotteryEventMeta(
  eventId: string,
  formData: FormData,
): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase
    .from("motm_lottery_events")
    .select("id, status, show_on_homepage")
    .eq("id", eventId)
    .maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  const status = (ev as { status: string }).status;

  const title = (formData.get("title") as string)?.trim();
  if (!title) return { ok: false, error: "Başlık zorunludur." };
  const description = ((formData.get("description") as string) ?? "").trim() || null;

  if (status === "drawn") {
    const { error } = await supabase
      .from("motm_lottery_events")
      .update({
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", eventId);
    if (error) return { ok: false, error: error.message };
    await maybeRevalidateHome(supabase, eventId);
    revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
    revalidate();
    return { ok: true };
  }

  const wc = parseInt(String(formData.get("winner_count") ?? "1"), 10);
  if (!Number.isFinite(wc) || wc < 1 || wc > 500) return { ok: false, error: "Talihli sayısı 1–500 arasında olmalıdır." };

  const { error } = await supabase
    .from("motm_lottery_events")
    .update({
      title,
      description,
      winner_count: wc,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };
  await maybeRevalidateHome(supabase, eventId);
  revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
  revalidate();
  return { ok: true };
}

/** Taslakta: kaynak maç listesini tamamen değiştirir. */
export async function setMotmLotteryEventMatches(eventId: string, matchIds: string[]): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase.from("motm_lottery_events").select("status").eq("id", eventId).maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  if ((ev as { status: string }).status !== "draft") {
    return { ok: false, error: "Kaynak maçları yalnızca taslak aşamasında değiştirebilirsiniz (önce «Taslağa dön» kullanın)." };
  }

  const uniq = [...new Set(matchIds.filter(Boolean))];
  await supabase.from("motm_lottery_event_matches").delete().eq("event_id", eventId);
  if (uniq.length > 0) {
    const { error } = await supabase.from("motm_lottery_event_matches").insert(
      uniq.map((match_id) => ({ event_id: eventId, match_id })),
    );
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
  revalidate();
  return { ok: true };
}

/** MOTM oyu bulunan maçlar içinden takvimde en yeni iki maçı havuz kaynağı olarak bağlar (taslak). */
export async function applyLastTwoMotmVoteMatches(eventId: string): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase.from("motm_lottery_events").select("status").eq("id", eventId).maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  if ((ev as { status: string }).status !== "draft") {
    return { ok: false, error: "Bu kısayol yalnızca taslak aşamasında kullanılır." };
  }

  const { data: allVotes, error: vErr } = await supabase.from("match_motm_votes").select("match_id");
  if (vErr) return { ok: false, error: vErr.message };
  const withVotes = new Set((allVotes ?? []).map((r: { match_id: string }) => r.match_id));
  if (withVotes.size === 0) return { ok: false, error: "Henüz MOTM oyu bulunan maç yok." };

  const ids = [...withVotes];
  const { data: matches, error: mErr } = await supabase
    .from("matches")
    .select("id, match_date")
    .in("id", ids)
    .order("match_date", { ascending: false })
    .order("id", { ascending: false });
  if (mErr) return { ok: false, error: mErr.message };

  const twoIds = (matches ?? []).slice(0, 2).map((m: { id: string }) => m.id);
  return setMotmLotteryEventMatches(eventId, twoIds);
}

export async function setMotmLotteryShowOnHomepage(eventId: string, show: boolean): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase.from("motm_lottery_events").select("status").eq("id", eventId).maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  if ((ev as { status: string }).status !== "drawn") {
    return { ok: false, error: "Ana sayfa bandı yalnızca çekilişi tamamlanmış etkinlikler için kullanılabilir." };
  }

  if (show) {
    const { error: e1 } = await supabase.from("motm_lottery_events").update({ show_on_homepage: false }).eq("show_on_homepage", true);
    if (e1) return { ok: false, error: e1.message };
  }

  const { error: e2 } = await supabase
    .from("motm_lottery_events")
    .update({ show_on_homepage: show, updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (e2) return { ok: false, error: e2.message };

  revalidatePath("/");
  revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
  revalidate();
  return { ok: true };
}

/** Havuzu kur veya havuz hazırken yeniden kur (yeni oylar). */
export async function buildMotmLotteryPool(eventId: string): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase
    .from("motm_lottery_events")
    .select("id, status, winner_count")
    .eq("id", eventId)
    .maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  const row = ev as { status: string; winner_count: number };
  if (row.status === "drawn") return { ok: false, error: "Çekiliş yapılmış etkinlikte havuz değiştirilemez." };

  const { data: links, error: lErr } = await supabase.from("motm_lottery_event_matches").select("match_id").eq("event_id", eventId);
  if (lErr) return { ok: false, error: lErr.message };
  const matchIds = [...new Set((links ?? []).map((r: { match_id: string }) => r.match_id))];
  if (matchIds.length === 0) return { ok: false, error: "En az bir maç seçmelisiniz." };

  const { data: voteRows, error: vErr } = await supabase
    .from("match_motm_votes")
    .select("user_id, match_id")
    .in("match_id", matchIds);
  if (vErr) return { ok: false, error: vErr.message };

  const byUser = new Map<string, Set<string>>();
  for (const r of voteRows ?? []) {
    const u = (r as { user_id: string; match_id: string }).user_id;
    const m = (r as { user_id: string; match_id: string }).match_id;
    if (!byUser.has(u)) byUser.set(u, new Set());
    byUser.get(u)!.add(m);
  }

  await supabase.from("motm_lottery_pool_members").delete().eq("event_id", eventId);

  const poolRows = [...byUser.entries()].map(([user_id, set]) => ({
    event_id: eventId,
    user_id,
    source_match_count: Math.min(32767, set.size),
  }));

  if (poolRows.length > 0) {
    const { error: insErr } = await supabase.from("motm_lottery_pool_members").insert(poolRows);
    if (insErr) return { ok: false, error: insErr.message };
  }

  const now = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("motm_lottery_events")
    .update({
      status: "pool_ready",
      pool_built_at: now,
      updated_at: now,
    })
    .eq("id", eventId);
  if (upErr) return { ok: false, error: upErr.message };

  revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
  revalidate();
  return { ok: true };
}

/** Havuz hazırdan taslağa (maç listesini değiştirmek için). */
export async function revertMotmLotteryToDraft(eventId: string): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase.from("motm_lottery_events").select("status").eq("id", eventId).maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  if ((ev as { status: string }).status === "drawn") return { ok: false, error: "Çekiliş tamamlanmış etkinlik geri alınamaz." };

  await supabase.from("motm_lottery_pool_members").delete().eq("event_id", eventId);
  const { error } = await supabase
    .from("motm_lottery_events")
    .update({
      status: "draft",
      pool_built_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
  revalidate();
  return { ok: true };
}

export async function runMotmLotteryDraw(eventId: string): Promise<MotmLotteryActionResult> {
  const supabase = await db();
  const { data: ev, error: evErr } = await supabase
    .from("motm_lottery_events")
    .select("id, status, winner_count")
    .eq("id", eventId)
    .maybeSingle();
  if (evErr || !ev) return { ok: false, error: "Etkinlik bulunamadı." };
  const evRow = ev as { status: string; winner_count: number };
  if (evRow.status !== "pool_ready") return { ok: false, error: "Önce havuzu oluşturmalısınız." };

  const { data: pool, error: pErr } = await supabase.from("motm_lottery_pool_members").select("user_id").eq("event_id", eventId);
  if (pErr) return { ok: false, error: pErr.message };
  const userIds = (pool ?? []).map((r: { user_id: string }) => r.user_id);
  const n = userIds.length;
  const k = evRow.winner_count;
  if (n === 0) return { ok: false, error: "Havuz boş; seçilen maçlarda oy yok." };
  if (k > n) return { ok: false, error: `Talihli sayısı (${k}) havuzdaki üye sayısından (${n}) fazla olamaz.` };

  const { data: existingDraw } = await supabase.from("motm_lottery_draws").select("id").eq("event_id", eventId).maybeSingle();
  if (existingDraw) return { ok: false, error: "Bu etkinlik için çekiliş zaten kayıtlı." };

  const seedHex = randomBytes(16).toString("hex");
  const shuffled = shuffleUserIdsFair(userIds);
  const picked = shuffled.slice(0, k);
  const { data: profRows } = await supabase
    .from("fan_profiles")
    .select("user_id, first_name, last_name")
    .in("user_id", picked);
  const nameByUser = new Map(
    (profRows ?? []).map((p) => {
      const r = p as { user_id: string; first_name: string; last_name: string };
      const dn = `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim();
      return [r.user_id, dn || "Taraftar"] as const;
    }),
  );
  const winners = picked.map((user_id, i) => ({
    user_id,
    place: i + 1,
    display_name: nameByUser.get(user_id) ?? "Taraftar",
  }));

  const { data: drawRow, error: dErr } = await supabase
    .from("motm_lottery_draws")
    .insert({
      event_id: eventId,
      pool_size_snapshot: n,
      winner_count_snapshot: k,
      random_seed_hex: seedHex,
    })
    .select("id")
    .single();
  if (dErr || !drawRow) {
    return { ok: false, error: dErr?.message ?? "Çekiliş kaydı oluşturulamadı." };
  }
  const drawId = (drawRow as { id: string }).id;

  const { error: wErr } = await supabase.from("motm_lottery_winners").insert(
    winners.map((w) => ({
      draw_id: drawId,
      user_id: w.user_id,
      place: w.place,
      display_name: w.display_name,
    })),
  );
  if (wErr) {
    await supabase.from("motm_lottery_draws").delete().eq("id", drawId);
    return { ok: false, error: wErr.message };
  }

  const { error: finErr } = await supabase
    .from("motm_lottery_events")
    .update({ status: "drawn", updated_at: new Date().toISOString() })
    .eq("id", eventId);
  if (finErr) return { ok: false, error: finErr.message };

  revalidatePath(`/admin/maclar/motm-cekilis/${eventId}`);
  revalidate();
  return { ok: true };
}

function redetail(id: string, err?: string, ok?: string) {
  const q = new URLSearchParams();
  if (err) q.set("err", err);
  if (ok) q.set("ok", ok);
  const s = q.toString();
  redirect(`/admin/maclar/motm-cekilis/${id}${s ? `?${s}` : ""}`);
}

export async function updateMotmLotteryEventMetaForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await updateMotmLotteryEventMeta(eventId, formData);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "meta");
}

export async function setMotmLotteryEventMatchesForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const matchIds = formData.getAll("match_id").map(String).filter(Boolean);
  const r = await setMotmLotteryEventMatches(eventId, matchIds);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "matches");
}

export async function buildMotmLotteryPoolForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await buildMotmLotteryPool(eventId);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "pool");
}

export async function revertMotmLotteryToDraftForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await revertMotmLotteryToDraft(eventId);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "draft");
}

export async function runMotmLotteryDrawForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await runMotmLotteryDraw(eventId);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "draw");
}

export async function applyLastTwoMotmVoteMatchesForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await applyLastTwoMotmVoteMatches(eventId);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "last2");
}

export async function publishMotmLotteryToHomepageForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await setMotmLotteryShowOnHomepage(eventId, true);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "home");
}

export async function unpublishMotmLotteryFromHomepageForm(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "").trim();
  if (!eventId) redirect("/admin/maclar/motm-cekilis?err=" + encodeURIComponent("Geçersiz istek."));
  const r = await setMotmLotteryShowOnHomepage(eventId, false);
  if (!r.ok) redetail(eventId, r.error);
  redetail(eventId, undefined, "home");
}
