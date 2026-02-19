"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/app/admin/actions";

async function supabase() {
  return getAdminSupabase();
}

// ——— Maçlar ———
export async function createMatch(formData: FormData) {
  const s = await supabase();
  const { error } = await s.from("matches").insert({
    opponent_name: (formData.get("opponent_name") as string)?.trim(),
    home_away: formData.get("home_away") as "home" | "away",
    venue: (formData.get("venue") as string)?.trim() || null,
    match_date: formData.get("match_date") as string,
    match_time: (formData.get("match_time") as string)?.trim() || null,
    opponent_logo_url: (formData.get("opponent_logo_url") as string)?.trim() || null,
    competition: (formData.get("competition") as string)?.trim() || null,
    season: (formData.get("season") as string)?.trim() || null,
    goals_for: formData.get("goals_for") ? parseInt(formData.get("goals_for") as string, 10) : null,
    goals_against: formData.get("goals_against") ? parseInt(formData.get("goals_against") as string, 10) : null,
    status: (formData.get("status") as string) || "scheduled",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  return { ok: true };
}

export async function updateMatch(id: string, formData: FormData) {
  const s = await supabase();
  const { error } = await s.from("matches").update({
    opponent_name: (formData.get("opponent_name") as string)?.trim(),
    home_away: formData.get("home_away") as "home" | "away",
    venue: (formData.get("venue") as string)?.trim() || null,
    match_date: formData.get("match_date") as string,
    match_time: (formData.get("match_time") as string)?.trim() || null,
    opponent_logo_url: (formData.get("opponent_logo_url") as string)?.trim() || null,
    competition: (formData.get("competition") as string)?.trim() || null,
    season: (formData.get("season") as string)?.trim() || null,
    goals_for: formData.get("goals_for") ? parseInt(formData.get("goals_for") as string, 10) : null,
    goals_against: formData.get("goals_against") ? parseInt(formData.get("goals_against") as string, 10) : null,
    status: (formData.get("status") as string) || "scheduled",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  revalidatePath(`/maclar/${id}`);
  return { ok: true };
}

export async function deleteMatch(id: string) {
  const s = await supabase();
  const { error } = await s.from("matches").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/maclar");
  revalidatePath("/maclar");
  return { ok: true };
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
  const slug = (formData.get("slug") as string)?.trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const eventDate = (formData.get("event_date") as string)?.trim() || null;
  const eventEndDate = (formData.get("event_end_date") as string)?.trim() || null;
  const capacityVal = formData.get("capacity");
  const { error } = await s.from("news").insert({
    title,
    slug,
    excerpt: (formData.get("excerpt") as string)?.trim() || null,
    body: (formData.get("body") as string)?.trim() || null,
    published_at: (formData.get("published_at") as string) || null,
    image_url: (formData.get("image_url") as string)?.trim() || null,
    event_date: eventDate || null,
    event_end_date: eventEndDate || null,
    event_time: (formData.get("event_time") as string)?.trim() || null,
    event_place: (formData.get("event_place") as string)?.trim() || null,
    event_type: (formData.get("event_type") as string)?.trim() || null,
    capacity: capacityVal ? parseInt(capacityVal as string, 10) : null,
    registration_url: (formData.get("registration_url") as string)?.trim() || null,
    is_online: formData.get("is_online") === "on",
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
  const { error } = await s.from("news").update({
    title,
    slug,
    excerpt: (formData.get("excerpt") as string)?.trim() || null,
    body: (formData.get("body") as string)?.trim() || null,
    published_at: (formData.get("published_at") as string) || null,
    image_url: (formData.get("image_url") as string)?.trim() || null,
    event_date: eventDate || null,
    event_end_date: eventEndDate || null,
    event_time: (formData.get("event_time") as string)?.trim() || null,
    event_place: (formData.get("event_place") as string)?.trim() || null,
    event_type: (formData.get("event_type") as string)?.trim() || null,
    capacity: capacityVal ? parseInt(capacityVal as string, 10) : null,
    registration_url: (formData.get("registration_url") as string)?.trim() || null,
    is_online: formData.get("is_online") === "on",
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
  const { error } = await s.from("board_members").insert({
    name: (formData.get("name") as string)?.trim(),
    role_slug: formData.get("role_slug") as string,
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
  const { error } = await s.from("board_members").update({
    name: (formData.get("name") as string)?.trim(),
    role_slug: formData.get("role_slug") as string,
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
  const min_points = formData.get("min_points");
  const target_store = formData.get("target_store_spend");
  const target_tickets = formData.get("target_tickets");
  const target_donation = formData.get("target_donation");
  const { error } = await s.from("fan_levels").update({
    name: (formData.get("name") as string)?.trim(),
    slug: (formData.get("slug") as string)?.trim(),
    min_points: min_points != null ? parseInt(min_points as string, 10) : 0,
    sort_order: parseInt((formData.get("sort_order") as string) || "0", 10),
    description: (formData.get("description") as string)?.trim() || null,
    target_store_spend: target_store ? parseFloat(target_store as string) : null,
    target_tickets: target_tickets ? parseInt(target_tickets as string, 10) : null,
    target_donation: target_donation ? parseFloat(target_donation as string) : null,
  }).eq("id", parseInt(id, 10));
  if (error) return { error: error.message };
  revalidatePath("/admin/rozet");
  revalidatePath("/");
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
