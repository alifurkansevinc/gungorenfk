"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createFanProfileAfterSignup } from "@/app/actions/fan";
import type { City } from "@/types/db";
import type { District } from "@/types/db";
import type { Neighbourhood } from "@/types/db";

const ISTANBUL_CITY_ID = 34;
const GUNGOREN_DISTRICT_NAME = "Güngören";

type Props = { cities: City[] };

export function KayitFormu({ cities }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighbourhoods, setNeighbourhoods] = useState<Neighbourhood[]>([]);
  const [residenceCityId, setResidenceCityId] = useState<string>("");
  const [residenceDistrictId, setResidenceDistrictId] = useState<string>("");
  const [gungorenDistrictId, setGungorenDistrictId] = useState<number | null>(null);

  const showNeighbourhood = residenceCityId === String(ISTANBUL_CITY_ID) && gungorenDistrictId !== null && residenceDistrictId === String(gungorenDistrictId);

  const onResidenceCityChange = async (cityId: string) => {
    setResidenceCityId(cityId);
    setResidenceDistrictId("");
    setNeighbourhoods([]);
    if (!cityId) {
      setDistricts([]);
      return;
    }
    const res = await fetch(`/api/districts?city_id=${cityId}`);
    const data = await res.json();
    setDistricts(data);
    const gungoren = data.find((d: District) => d.name === GUNGOREN_DISTRICT_NAME);
    setGungorenDistrictId(gungoren?.id ?? null);
  };

  const onResidenceDistrictChange = async (districtId: string) => {
    setResidenceDistrictId(districtId);
    if (!districtId) {
      setNeighbourhoods([]);
      return;
    }
    const res = await fetch(`/api/neighbourhoods?district_id=${districtId}`);
    const data = await res.json();
    setNeighbourhoods(data);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const first_name = formData.get("first_name") as string;
    const last_name = formData.get("last_name") as string;
    const memleket_city_id = parseInt(formData.get("memleket_city_id") as string, 10);
    const residence_city_id = parseInt(formData.get("residence_city_id") as string, 10);
    const residence_district_id = formData.get("residence_district_id") ? parseInt(formData.get("residence_district_id") as string, 10) : null;
    const residence_neighbourhood_id = formData.get("residence_neighbourhood_id") ? parseInt(formData.get("residence_neighbourhood_id") as string, 10) : null;
    const birth_year = formData.get("birth_year") ? parseInt(formData.get("birth_year") as string, 10) : null;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const supabase = createClient();
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }
      if (!signUpData.user) {
        setError("Kayıt oluşturulamadı.");
        setLoading(false);
        return;
      }
      const profileResult = await createFanProfileAfterSignup({
        first_name,
        last_name,
        memleket_city_id,
        residence_city_id,
        residence_district_id,
        residence_neighbourhood_id,
        birth_year,
        email,
      });
      if (profileResult.error) {
        setError(profileResult.error);
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mt-8 rounded-xl border-2 border-bordo bg-bordo/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-bordo text-4xl text-beyaz">🏅</div>
        <h2 className="text-xl font-bold text-siyah">Güngören BFK Fanı Rozeti</h2>
        <p className="mt-2 text-siyah/80">Kaydın tamamlandı. Artık resmi taraftarımızsın!</p>
        <p className="mt-4 text-sm text-siyah/70">Maçlara gelerek ve mağazadan alışveriş yaparak rozetini büyütebilirsin (Beyaz → Bronz → Gümüş → Altın → Platinium).</p>
        <a href="/taraftar" className="mt-6 inline-block rounded-lg bg-bordo px-6 py-3 font-medium text-beyaz hover:bg-bordo-dark transition-colors">Taraftar Paneline Git</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 border border-red-200">{error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-siyah">İsim</label>
          <input id="first_name" name="first_name" required className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah" placeholder="Adın" />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-siyah">Soyisim</label>
          <input id="last_name" name="last_name" required className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah" placeholder="Soyadın" />
        </div>
      </div>
      <div>
        <label htmlFor="memleket_city_id" className="block text-sm font-medium text-siyah">Memleket (81 il)</label>
        <select id="memleket_city_id" name="memleket_city_id" required className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah">
          <option value="">Seçiniz</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="residence_city_id" className="block text-sm font-medium text-siyah">İkamet ili</label>
        <select
          id="residence_city_id"
          name="residence_city_id"
          required
          className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah"
          value={residenceCityId}
          onChange={(e) => onResidenceCityChange(e.target.value)}
        >
          <option value="">Seçiniz</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      {districts.length > 0 && (
        <div>
          <label htmlFor="residence_district_id" className="block text-sm font-medium text-siyah">İkamet ilçesi</label>
          <select
            id="residence_district_id"
            name="residence_district_id"
            className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah"
            value={residenceDistrictId}
            onChange={(e) => onResidenceDistrictChange(e.target.value)}
          >
            <option value="">Seçiniz</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      )}
      {showNeighbourhood && neighbourhoods.length > 0 && (
        <div>
          <label htmlFor="residence_neighbourhood_id" className="block text-sm font-medium text-siyah">Mahalle (Güngören)</label>
          <select id="residence_neighbourhood_id" name="residence_neighbourhood_id" className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah">
            <option value="">Seçiniz</option>
            {neighbourhoods.map((n) => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor="birth_year" className="block text-sm font-medium text-siyah">Doğum yılı (yaş için)</label>
        <input id="birth_year" name="birth_year" type="number" min="1920" max={new Date().getFullYear()} className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah" placeholder="Örn. 1990" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-siyah">E-posta</label>
        <input id="email" name="email" type="email" required className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah" placeholder="ornek@email.com" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-siyah">Şifre</label>
        <input id="password" name="password" type="password" required minLength={6} className="mt-1 w-full rounded-lg border border-black/20 px-3 py-2 text-siyah" placeholder="En az 6 karakter" />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-bordo py-3 font-semibold text-beyaz hover:bg-bordo-dark disabled:opacity-50 transition-colors"
      >
        {loading ? "Kaydediliyor..." : "Taraftar Ol"}
      </button>
    </form>
  );
}
