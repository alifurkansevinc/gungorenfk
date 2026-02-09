import { createClient } from "@/lib/supabase/server";
import type { City, District, Neighbourhood } from "@/types/db";

const ISTANBUL_CITY_ID = 34;
const GUNGOREN_DISTRICT_NAME = "Güngören";

export async function getCities(): Promise<City[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cities").select("id, name, plate_no").order("plate_no");
  if (error) return [];
  return data ?? [];
}

export async function getDistrictsByCity(cityId: number): Promise<District[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("districts")
    .select("id, city_id, name")
    .eq("city_id", cityId)
    .order("name");
  if (error) return [];
  return data ?? [];
}

export async function getNeighbourhoodsByDistrict(districtId: number): Promise<Neighbourhood[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("neighbourhoods")
    .select("id, district_id, name")
    .eq("district_id", districtId)
    .order("name");
  if (error) return [];
  return data ?? [];
}

export async function getGungorenDistrictId(): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("districts")
    .select("id")
    .eq("city_id", ISTANBUL_CITY_ID)
    .eq("name", GUNGOREN_DISTRICT_NAME)
    .single();
  return data?.id ?? null;
}

export { ISTANBUL_CITY_ID, GUNGOREN_DISTRICT_NAME };
