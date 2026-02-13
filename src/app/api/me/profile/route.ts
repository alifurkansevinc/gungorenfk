import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Giriş yapmış taraftarın profil bilgisi (ödeme sayfası ön doldurma). */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("fan_profiles")
    .select("first_name, last_name, email, residence_city_id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({
      success: true,
      data: { fullName: "", email: user.email ?? "", city: "" },
    });
  }

  let cityName = "";
  if (profile.residence_city_id) {
    const { data: city } = await supabase
      .from("cities")
      .select("name")
      .eq("id", profile.residence_city_id)
      .single();
    cityName = city?.name ?? "";
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return NextResponse.json({
    success: true,
    data: {
      fullName,
      email: profile.email ?? user.email ?? "",
      city: cityName,
    },
  });
}
