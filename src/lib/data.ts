import { createClient } from "@/lib/supabase/server";
import type { MemleketCount } from "@/types/db";

const TARGET_PER_CITY = 1000;

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

export { TARGET_PER_CITY };
