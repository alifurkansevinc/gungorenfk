"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMatch, updateMatch } from "@/app/actions/admin";

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Planlandı" },
  { value: "live", label: "Canlı" },
  { value: "finished", label: "Oynandı" },
  { value: "postponed", label: "Ertelendi" },
  { value: "cancelled", label: "İptal" },
];

type MatchRow = {
  id: string;
  opponent_name: string;
  home_away: "home" | "away";
  venue: string | null;
  match_date: string;
  competition: string | null;
  season: string | null;
  goals_for: number | null;
  goals_against: number | null;
  status: string;
};

export function MacForm({ match }: { match?: MatchRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = match
      ? await updateMatch(match.id, formData)
      : await createMatch(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/maclar");
    router.refresh();
  }

  const dateValue = match?.match_date ? match.match_date.toString().slice(0, 10) : "";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Rakip takım *</label>
        <input name="opponent_name" defaultValue={match?.opponent_name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Ev / Deplasman *</label>
        <select name="home_away" defaultValue={match?.home_away ?? "home"} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
          <option value="home">Ev</option>
          <option value="away">Deplasman</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Maç tarihi *</label>
        <input name="match_date" type="date" defaultValue={dateValue} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Stadyum / Salon</label>
        <input name="venue" defaultValue={match?.venue ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-siyah">Müsabaka</label>
          <input name="competition" defaultValue={match?.competition ?? ""} placeholder="Lig / Kupa" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Sezon</label>
          <input name="season" defaultValue={match?.season ?? ""} placeholder="2024-25" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Durum *</label>
        <select name="status" defaultValue={match?.status ?? "scheduled"} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-siyah">Attığımız gol</label>
          <input name="goals_for" type="number" min={0} defaultValue={match?.goals_for ?? ""} placeholder="—" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Yediğimiz gol</label>
          <input name="goals_against" type="number" min={0} defaultValue={match?.goals_against ?? ""} placeholder="—" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">
          {match ? "Güncelle" : "Ekle"}
        </button>
        <Link href="/admin/maclar" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">
          İptal
        </Link>
      </div>
    </form>
  );
}
