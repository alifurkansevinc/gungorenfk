"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type FanProfileInput = {
  first_name: string;
  last_name: string;
  memleket_city_id: number;
  residence_city_id: number;
  residence_district_id: number | null;
  residence_neighbourhood_id: number | null;
  birth_year: number | null;
  email: string;
};

export async function createFanProfileAfterSignup(input: FanProfileInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Oturum bulunamadı. Lütfen kayıt olduktan sonra tekrar dene." };
  }
  const { error } = await supabase.from("fan_profiles").insert({
    user_id: user.id,
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    memleket_city_id: input.memleket_city_id,
    residence_city_id: input.residence_city_id,
    residence_district_id: input.residence_district_id || null,
    residence_neighbourhood_id: input.residence_neighbourhood_id || null,
    birth_year: input.birth_year || null,
    email: input.email.trim().toLowerCase(),
    fan_level_id: 1,
    points: 0,
  });
  if (error) {
    return { error: error.message };
  }
  return { ok: true };
}
