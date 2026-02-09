import { createClient } from "@/lib/supabase/server";
import type { MemleketCount, Match, SquadMember } from "@/types/db";

const TARGET_PER_CITY = 1000;
/** Anasayfa toplam taraftar barı hedefi */
export const TARGET_TOTAL_FANS = 10_000;

/** Demo maçlar (veri yokken tasarım için) */
export const DEMO_MATCHES: (Match & { id: string })[] = [
  { id: "demo-1", opponent_name: "Kartal Belediyespor", home_away: "home", venue: "Güngören Stadyumu", match_date: "2025-02-15", competition: "Bölgesel Amatör Lig", season: "2024-25", goals_for: 2, goals_against: 1, status: "finished", created_at: "", updated_at: "" },
  { id: "demo-2", opponent_name: "Sultanbeyli Belediyespor", home_away: "away", venue: "Sultanbeyli Stadyumu", match_date: "2025-02-08", competition: "Bölgesel Amatör Lig", season: "2024-25", goals_for: 1, goals_against: 1, status: "finished", created_at: "", updated_at: "" },
  { id: "demo-3", opponent_name: "Esenler Erokspor", home_away: "home", venue: "Güngören Stadyumu", match_date: "2025-02-01", competition: "Bölgesel Amatör Lig", season: "2024-25", goals_for: 3, goals_against: 0, status: "finished", created_at: "", updated_at: "" },
  { id: "demo-4", opponent_name: "Bayrampaşa FK", home_away: "away", venue: "Bayrampaşa Stadyumu", match_date: "2025-01-25", competition: "Bölgesel Amatör Lig", season: "2024-25", goals_for: 0, goals_against: 2, status: "finished", created_at: "", updated_at: "" },
  { id: "demo-5", opponent_name: "Gaziosmanpaşa FK", home_away: "away", venue: "Gaziosmanpaşa Stadyumu", match_date: "2025-03-01", competition: "Bölgesel Amatör Lig", season: "2024-25", goals_for: null, goals_against: null, status: "scheduled", created_at: "", updated_at: "" },
];

/** Demo kadro (veri yokken tasarım için) */
export const DEMO_SQUAD: (SquadMember & { id: string })[] = [
  { id: "demo-1", name: "Ahmet Yılmaz", shirt_number: 1, position: "Kaleci", photo_url: null, bio: "Deneyimli kaleci.", sort_order: 1, is_active: true },
  { id: "demo-2", name: "Mehmet Kaya", shirt_number: 2, position: "Sağ Bek", photo_url: null, bio: null, sort_order: 2, is_active: true },
  { id: "demo-3", name: "Ali Demir", shirt_number: 3, position: "Stoper", photo_url: null, bio: null, sort_order: 3, is_active: true },
  { id: "demo-4", name: "Can Özkan", shirt_number: 4, position: "Stoper", photo_url: null, bio: null, sort_order: 4, is_active: true },
  { id: "demo-5", name: "Emre Çelik", shirt_number: 5, position: "Sol Bek", photo_url: null, bio: null, sort_order: 5, is_active: true },
  { id: "demo-6", name: "Burak Arslan", shirt_number: 6, position: "Ön Libero", photo_url: null, bio: null, sort_order: 6, is_active: true },
  { id: "demo-7", name: "Serkan Aydın", shirt_number: 7, position: "Sağ Kanat", photo_url: null, bio: null, sort_order: 7, is_active: true },
  { id: "demo-8", name: "Oğuzhan Koç", shirt_number: 8, position: "Orta Saha", photo_url: null, bio: "Kaptan.", sort_order: 8, is_active: true },
  { id: "demo-9", name: "Fatih Şahin", shirt_number: 9, position: "Forvet", photo_url: null, bio: null, sort_order: 9, is_active: true },
  { id: "demo-10", name: "Hakan Polat", shirt_number: 10, position: "Orta Saha", photo_url: null, bio: null, sort_order: 10, is_active: true },
  { id: "demo-11", name: "Yusuf Acar", shirt_number: 11, position: "Sol Kanat", photo_url: null, bio: null, sort_order: 11, is_active: true },
  { id: "demo-12", name: "Murat Yıldız", shirt_number: 12, position: "Kaleci", photo_url: null, bio: null, sort_order: 12, is_active: true },
  { id: "demo-13", name: "Kerem Öztürk", shirt_number: 14, position: "Orta Saha", photo_url: null, bio: null, sort_order: 14, is_active: true },
  { id: "demo-14", name: "Barış Kılıç", shirt_number: 17, position: "Forvet", photo_url: null, bio: null, sort_order: 17, is_active: true },
];

/** Demo: Gerçek taraftar yokken tasarım için memleket sayıları (Anadolu Temsilcisi bar) */
const DEMO_MEMLEKET_COUNTS: MemleketCount[] = [
  { city_id: 34, city_name: "İstanbul", count: 247 },
  { city_id: 6, city_name: "Ankara", count: 189 },
  { city_id: 35, city_name: "İzmir", count: 156 },
  { city_id: 16, city_name: "Bursa", count: 98 },
  { city_id: 7, city_name: "Antalya", count: 87 },
  { city_id: 42, city_name: "Konya", count: 64 },
  { city_id: 27, city_name: "Gaziantep", count: 52 },
  { city_id: 55, city_name: "Samsun", count: 41 },
];

/** Anasayfa: Toplam kayıtlı taraftar sayısı. Veri yoksa demo toplam. */
export async function getTotalFanCount(): Promise<{ total: number; target: number }> {
  const supabase = await createClient();
  const { count, error } = await supabase.from("fan_profiles").select("id", { count: "exact", head: true });
  if (error || count === null) {
    const demoTotal = DEMO_MEMLEKET_COUNTS.reduce((s, c) => s + c.count, 0);
    return { total: demoTotal, target: TARGET_TOTAL_FANS };
  }
  return { total: count, target: TARGET_TOTAL_FANS };
}

/** Anasayfa: Memleket bazında kayıtlı taraftar sayıları (0–1000 progress bar için). Veri yoksa demo gösterilir. */
export async function getMemleketCounts(): Promise<MemleketCount[]> {
  const supabase = await createClient();
  const [profilesRes, citiesRes] = await Promise.all([
    supabase.from("fan_profiles").select("memleket_city_id"),
    supabase.from("cities").select("id, name"),
  ]);

  if (profilesRes.error || citiesRes.error) return DEMO_MEMLEKET_COUNTS;
  const data = profilesRes.data ?? [];
  if (data.length === 0) return DEMO_MEMLEKET_COUNTS;

  const cityNames = new Map((citiesRes.data ?? []).map((c) => [c.id, c.name]));
  const byCity = new Map<number, number>();
  for (const p of data) {
    const id = p.memleket_city_id;
    byCity.set(id, (byCity.get(id) ?? 0) + 1);
  }
  return Array.from(byCity.entries())
    .map(([city_id, count]) => ({ city_id, city_name: cityNames.get(city_id) ?? "Bilinmeyen", count }))
    .sort((a, b) => b.count - a.count);
}

/** Maçlar listesi; veri yoksa demo döner. */
export async function getMatches(limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select("id, opponent_name, home_away, venue, match_date, goals_for, goals_against, status, competition")
    .order("match_date", { ascending: false })
    .limit(limit);
  if (!data || data.length === 0) return DEMO_MATCHES;
  return data;
}

/** Tek maç; id demo-* ise demo maç, değilse veritabanından döner. */
export async function getMatchById(id: string): Promise<(Match & { id: string }) | null> {
  if (id.startsWith("demo-")) {
    return DEMO_MATCHES.find((m) => m.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase.from("matches").select("*").eq("id", id).single();
  return data;
}

/** Kadro listesi; veri yoksa demo döner. */
export async function getSquad() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("squad")
    .select("id, name, shirt_number, position, photo_url, bio")
    .eq("is_active", true)
    .order("sort_order");
  if (!data || data.length === 0) return DEMO_SQUAD;
  return data;
}

/** Son haberler (anasayfa için). */
export async function getLatestNews(limit = 4) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("id, title, slug, excerpt, image_url, published_at")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

/** Mağaza öne çıkan ürünler (anasayfa için). */
export async function getFeaturedProducts(limit = 4) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("id, name, slug, price, image_url")
    .eq("is_active", true)
    .order("sort_order")
    .limit(limit);
  return data ?? [];
}

/** Slug ile tek ürün (mağaza detay sayfası). */
export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export { TARGET_PER_CITY };
