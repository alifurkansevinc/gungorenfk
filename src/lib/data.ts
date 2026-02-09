import { createClient } from "@/lib/supabase/server";
import type { MemleketCount } from "@/types/db";

const TARGET_PER_CITY = 1000;

/** Anasayfa: Memleket bazında kayıtlı taraftar sayıları (0–1000 progress bar için) */
export async function getMemleketCounts(): Promise<MemleketCount[]> {
  const supabase = await createClient();
  const [profilesRes, citiesRes] = await Promise.all([
    supabase.from("fan_profiles").select("memleket_city_id"),
    supabase.from("cities").select("id, name"),
  ]);

  if (profilesRes.error || citiesRes.error) return [];
  const cityNames = new Map((citiesRes.data ?? []).map((c) => [c.id, c.name]));
  const byCity = new Map<number, number>();
  for (const p of profilesRes.data ?? []) {
    const id = p.memleket_city_id;
    byCity.set(id, (byCity.get(id) ?? 0) + 1);
  }
  return Array.from(byCity.entries())
    .map(([city_id, count]) => ({ city_id, city_name: cityNames.get(city_id) ?? "Bilinmeyen", count }))
    .sort((a, b) => b.count - a.count);
}

export { TARGET_PER_CITY };
