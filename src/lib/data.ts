import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import type { MemleketCount, Match, SquadMember, BoardMember, TechnicalStaffMember, LeagueStandingRow } from "@/types/db";
import type { FanLevel } from "@/types/db";

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
  { id: "demo-1", name: "Ahmet Yılmaz", shirt_number: 1, position: "Kaleci", position_category: "kl", photo_url: null, bio: "Deneyimli kaleci.", sort_order: 1, is_active: true, is_captain: false },
  { id: "demo-2", name: "Mehmet Kaya", shirt_number: 2, position: "Sağ Bek", position_category: "bek", photo_url: null, bio: null, sort_order: 2, is_active: true, is_captain: false },
  { id: "demo-3", name: "Ali Demir", shirt_number: 3, position: "Stoper", position_category: "stoper", photo_url: null, bio: null, sort_order: 3, is_active: true, is_captain: false },
  { id: "demo-4", name: "Can Özkan", shirt_number: 4, position: "Stoper", position_category: "stoper", photo_url: null, bio: null, sort_order: 4, is_active: true, is_captain: false },
  { id: "demo-5", name: "Emre Çelik", shirt_number: 5, position: "Sol Bek", position_category: "bek", photo_url: null, bio: null, sort_order: 5, is_active: true, is_captain: false },
  { id: "demo-6", name: "Burak Arslan", shirt_number: 6, position: "Ön Libero", position_category: "ortasaha", photo_url: null, bio: null, sort_order: 6, is_active: true, is_captain: false },
  { id: "demo-7", name: "Serkan Aydın", shirt_number: 7, position: "Sağ Kanat", position_category: "kanat", photo_url: null, bio: null, sort_order: 7, is_active: true, is_captain: false },
  { id: "demo-8", name: "Oğuzhan Koç", shirt_number: 8, position: "Orta Saha", position_category: "ortasaha", photo_url: null, bio: "Kaptan.", sort_order: 8, is_active: true, is_captain: true },
  { id: "demo-9", name: "Fatih Şahin", shirt_number: 9, position: "Forvet", position_category: "forvet", photo_url: null, bio: null, sort_order: 9, is_active: true, is_captain: false },
  { id: "demo-10", name: "Hakan Polat", shirt_number: 10, position: "Orta Saha", position_category: "ortasaha", photo_url: null, bio: null, sort_order: 10, is_active: true, is_captain: false },
  { id: "demo-11", name: "Yusuf Acar", shirt_number: 11, position: "Sol Kanat", position_category: "kanat", photo_url: null, bio: null, sort_order: 11, is_active: true, is_captain: false },
  { id: "demo-12", name: "Murat Yıldız", shirt_number: 12, position: "Kaleci", position_category: "kl", photo_url: null, bio: null, sort_order: 12, is_active: true, is_captain: false },
  { id: "demo-13", name: "Kerem Öztürk", shirt_number: 14, position: "Orta Saha", position_category: "ortasaha", photo_url: null, bio: null, sort_order: 14, is_active: true, is_captain: false },
  { id: "demo-14", name: "Barış Kılıç", shirt_number: 17, position: "Forvet", position_category: "forvet", photo_url: null, bio: null, sort_order: 17, is_active: true, is_captain: false },
];

/** Demo yönetim kurulu (veri yokken) */
export const DEMO_BOARD: BoardMember[] = [
  { id: "b-1", name: "Ahmet Yılmaz", role_slug: "baskan", photo_url: null, sort_order: 1, is_active: true },
  { id: "b-2", name: "Mehmet Kaya", role_slug: "baskan_vekili", photo_url: null, sort_order: 2, is_active: true },
  { id: "b-3", name: "Ali Demir", role_slug: "as_baskan", photo_url: null, sort_order: 3, is_active: true },
  { id: "b-4", name: "Ayşe Özkan", role_slug: "as_baskan", photo_url: null, sort_order: 4, is_active: true },
  { id: "b-5", name: "Fatma Çelik", role_slug: "yk_uyesi", photo_url: null, sort_order: 5, is_active: true },
  { id: "b-6", name: "Mustafa Arslan", role_slug: "yk_uyesi", photo_url: null, sort_order: 6, is_active: true },
  { id: "b-7", name: "Zeynep Aydın", role_slug: "yk_uyesi", photo_url: null, sort_order: 7, is_active: true },
  { id: "b-8", name: "Kemal Yıldız", role_slug: "yuksek_istisare_heyeti", photo_url: null, sort_order: 8, is_active: true },
  { id: "b-9", name: "Selma Koç", role_slug: "yuksek_istisare_heyeti", photo_url: null, sort_order: 9, is_active: true },
  { id: "b-10", name: "Cem Öztürk", role_slug: "yuksek_istisare_heyeti", photo_url: null, sort_order: 10, is_active: true },
  { id: "b-11", name: "Deniz Şahin", role_slug: "yuksek_istisare_heyeti", photo_url: null, sort_order: 11, is_active: true },
  { id: "b-12", name: "Emre Danışman", role_slug: "danisman", photo_url: null, sort_order: 12, is_active: true },
  { id: "b-13", name: "Elif Danışman", role_slug: "danisman", photo_url: null, sort_order: 13, is_active: true },
];

/** Demo teknik heyet (veri yokken) */
export const DEMO_TECHNICAL_STAFF: TechnicalStaffMember[] = [
  { id: "t-1", name: "Ahmet Hoca", role_slug: "teknik_direktor", photo_url: null, sort_order: 1, is_active: true },
  { id: "t-2", name: "Mehmet Yardımcı", role_slug: "yardimci_hoca", photo_url: null, sort_order: 2, is_active: true },
  { id: "t-3", name: "Ali Kaleci Antrenörü", role_slug: "kaleci_antrenoru", photo_url: null, sort_order: 3, is_active: true },
  { id: "t-4", name: "Can Altyapı", role_slug: "altyapi_td", photo_url: null, sort_order: 4, is_active: true },
  { id: "t-5", name: "Barış Gelişim", role_slug: "gelisim_direktoru", photo_url: null, sort_order: 5, is_active: true },
  { id: "t-6", name: "Cem Futbol", role_slug: "futbol_direktoru", photo_url: null, sort_order: 6, is_active: true },
  { id: "t-7", name: "Deniz Kulüp", role_slug: "kulup_muduru", photo_url: null, sort_order: 7, is_active: true },
  { id: "t-8", name: "Ece Lojistik", role_slug: "lojistik_muduru", photo_url: null, sort_order: 8, is_active: true },
  { id: "t-9", name: "Fulya Fizyoterapist", role_slug: "fizyoterapist", photo_url: null, sort_order: 9, is_active: true },
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

/** Anasayfa: Toplam kayıtlı taraftar sayısı. Service role ile okunur (RLS anonimde fan_profiles okumayı engeller). */
export async function getTotalFanCount(): Promise<{ total: number; target: number }> {
  try {
    const supabase = createServiceRoleClient();
    const { count, error } = await supabase.from("fan_profiles").select("id", { count: "exact", head: true });
    if (!error && count !== null) return { total: count, target: TARGET_TOTAL_FANS };
  } catch {
    /* SUPABASE_SERVICE_ROLE_KEY yoksa veya hata olursa demo */
  }
  const demoTotal = DEMO_MEMLEKET_COUNTS.reduce((s, c) => s + c.count, 0);
  return { total: demoTotal, target: TARGET_TOTAL_FANS };
}

/** Anasayfa: Memleket bazında kayıtlı taraftar sayıları (1000 Taraftar 1 Bayrak bar). Service role ile okunur. */
export async function getMemleketCounts(): Promise<MemleketCount[]> {
  try {
    const supabase = createServiceRoleClient();
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
  } catch {
    return DEMO_MEMLEKET_COUNTS;
  }
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

/** Tüm rozet kademeleri (açıklama ve hedefler dahil). */
export async function getFanLevels(): Promise<FanLevel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("fan_levels")
    .select("id, name, slug, min_points, sort_order, description, target_store_spend, target_tickets, target_donation")
    .order("sort_order");
  return (data ?? []) as FanLevel[];
}

/** Kadro listesi; veri yoksa demo döner. */
export async function getSquad() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("squad")
    .select("id, name, shirt_number, position, position_category, photo_url, bio, sort_order, is_captain")
    .eq("is_active", true)
    .order("sort_order");
  if (!data || data.length === 0) return DEMO_SQUAD;
  return data.map((r) => ({
    ...r,
    position_category: r.position_category ?? null,
    is_captain: r.is_captain ?? false,
    is_active: true,
  })) as SquadMember[];
}

/** Yönetim kurulu; veri yoksa demo döner. */
export async function getBoardMembers(): Promise<BoardMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("board_members")
    .select("id, name, role_slug, photo_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");
  if (!data || data.length === 0) return DEMO_BOARD;
  return data as BoardMember[];
}

/** Teknik heyet; veri yoksa demo döner. Öncelik sırası: teknik_direktor → fizyoterapist. */
export async function getTechnicalStaff(): Promise<TechnicalStaffMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("technical_staff")
    .select("id, name, role_slug, photo_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order");
  if (!data || data.length === 0) return DEMO_TECHNICAL_STAFF;
  return data as TechnicalStaffMember[];
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

/** Mağaza ürünleri (anasayfa veya mağaza sayfası). DB boşsa demo ürünler döner. */
export async function getFeaturedProducts(limit = 4) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("id, name, slug, description, price, image_url")
    .eq("is_active", true)
    .order("sort_order")
    .limit(limit);
  if (data && data.length > 0) return data;
  const { DEMO_PRODUCTS } = await import("@/lib/demo-products");
  return DEMO_PRODUCTS.slice(0, limit).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    image_url: p.image_url,
  }));
}

/** Slug ile tek ürün (mağaza detay). DB’de yoksa demo ürünlerden döner. */
export async function getProductBySlug(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (data) return data;
  const { getDemoProductBySlug } = await import("@/lib/demo-products");
  const demo = getDemoProductBySlug(slug);
  if (!demo) return null;
  return {
    id: demo.id,
    name: demo.name,
    slug: demo.slug,
    description: demo.description,
    price: demo.price,
    image_url: demo.image_url,
    sort_order: demo.sort_order,
    is_active: true,
  };
}

/** Puan durumu (Mackolik sync). Veri yoksa demo. */
const DEMO_STANDINGS: LeagueStandingRow[] = [
  { id: "s1", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 1, team_name: "Güngören Bld", played: 18, goal_diff: 59, wins: 17, draws: 0, losses: 1, goals_for: 71, goals_against: 12, points: 51, updated_at: new Date().toISOString() },
  { id: "s2", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 2, team_name: "Çankırı Maruf", played: 18, goal_diff: 17, wins: 11, draws: 2, losses: 5, goals_for: 40, goals_against: 23, points: 35, updated_at: new Date().toISOString() },
  { id: "s3", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 3, team_name: "Yeşilova Esnaf", played: 18, goal_diff: 24, wins: 11, draws: 2, losses: 5, goals_for: 46, goals_against: 22, points: 35, updated_at: new Date().toISOString() },
  { id: "s4", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 4, team_name: "Emirefendi", played: 18, goal_diff: 19, wins: 11, draws: 2, losses: 5, goals_for: 44, goals_against: 25, points: 35, updated_at: new Date().toISOString() },
  { id: "s5", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 5, team_name: "Taşlıtarlaspor", played: 18, goal_diff: -4, wins: 8, draws: 2, losses: 8, goals_for: 20, goals_against: 24, points: 26, updated_at: new Date().toISOString() },
  { id: "s6", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 6, team_name: "Kuruçeşmespor", played: 18, goal_diff: 3, wins: 8, draws: 2, losses: 8, goals_for: 30, goals_against: 27, points: 26, updated_at: new Date().toISOString() },
  { id: "s7", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 7, team_name: "Ç. Zümrüt 80", played: 18, goal_diff: -13, wins: 6, draws: 1, losses: 11, goals_for: 32, goals_against: 45, points: 19, updated_at: new Date().toISOString() },
  { id: "s8", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 8, team_name: "M.Kemalpaşaspor", played: 18, goal_diff: -15, wins: 5, draws: 2, losses: 11, goals_for: 25, goals_against: 40, points: 17, updated_at: new Date().toISOString() },
  { id: "s9", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 9, team_name: "Altınyıldız", played: 18, goal_diff: -31, wins: 4, draws: 1, losses: 13, goals_for: 26, goals_against: 57, points: 13, updated_at: new Date().toISOString() },
  { id: "s10", league_name: "İstanbul - 1. Amatör Lig - 5. Grup", season: "2025/2026", position: 10, team_name: "Mimarsinanspor", played: 18, goal_diff: -59, wins: 1, draws: 2, losses: 15, goals_for: 16, goals_against: 75, points: 5, updated_at: new Date().toISOString() },
];

export async function getLeagueStandings(leagueSeason?: { league_name: string; season: string }): Promise<{ rows: LeagueStandingRow[]; league_name: string; season: string; updated_at: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("league_standings")
    .select("id, league_name, season, position, team_name, played, goal_diff, wins, draws, losses, goals_for, goals_against, points, updated_at")
    .order("position");
  if (data && data.length > 0) {
    const first = data[0] as LeagueStandingRow;
    return {
      rows: data as LeagueStandingRow[],
      league_name: first.league_name,
      season: first.season,
      updated_at: first.updated_at ?? null,
    };
  }
  return {
    rows: DEMO_STANDINGS,
    league_name: DEMO_STANDINGS[0]!.league_name,
    season: DEMO_STANDINGS[0]!.season,
    updated_at: null,
  };
}

export { TARGET_PER_CITY };
