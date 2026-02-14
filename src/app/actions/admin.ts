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
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/kadro");
  revalidatePath("/kadro");
  return { ok: true };
}

// ——— Haberler / Gelişmeler ———
export async function createNews(formData: FormData) {
  const s = await supabase();
  const title = (formData.get("title") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim() || title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const { error } = await s.from("news").insert({
    title,
    slug,
    excerpt: (formData.get("excerpt") as string)?.trim() || null,
    body: (formData.get("body") as string)?.trim() || null,
    published_at: (formData.get("published_at") as string) || null,
    image_url: (formData.get("image_url") as string)?.trim() || null,
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
  const { error } = await s.from("news").update({
    title,
    slug,
    excerpt: (formData.get("excerpt") as string)?.trim() || null,
    body: (formData.get("body") as string)?.trim() || null,
    published_at: (formData.get("published_at") as string) || null,
    image_url: (formData.get("image_url") as string)?.trim() || null,
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
