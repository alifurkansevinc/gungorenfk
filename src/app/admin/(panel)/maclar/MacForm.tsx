"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMatch, updateMatch } from "@/app/actions/admin";

const LIG_OPTIONS = [
  "Süper Lig",
  "PTT 1.Lig",
  "Nesine 2.Lig",
  "Nesine 3.Lig",
  "Bölgesel Amatör Lig",
  "Süper Amatör Lig",
  "1.Amatör Lig",
  "2.Amatör Lig",
] as const;

const SEZON_OPTIONS = ["2025-26", "2026-27", "2027-28"] as const;

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
  match_time: string | null;
  opponent_logo_url: string | null;
  competition: string | null;
  season: string | null;
  goals_for: number | null;
  goals_against: number | null;
  status: string;
};

type SquadOption = { id: string; name: string; shirt_number: number | null };

type GoalRow = { minute: number; scorer_squad_id: string; assist_squad_id: string };

type Props = {
  match?: MatchRow | null;
  squad?: SquadOption[];
  matchGoals?: { minute: number; scorer_squad_id: string; assist_squad_id: string | null }[];
  starters?: string[];
  substitutes?: string[];
  manOfTheMatchId?: string | null;
};

export function MacForm({ match, squad = [], matchGoals = [], starters = [], substitutes = [], manOfTheMatchId = null }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [goalRows, setGoalRows] = useState<GoalRow[]>(() =>
    matchGoals.length > 0
      ? matchGoals.map((g) => ({ minute: g.minute, scorer_squad_id: g.scorer_squad_id, assist_squad_id: g.assist_squad_id ?? "" }))
      : [{ minute: 0, scorer_squad_id: "", assist_squad_id: "" }]
  );
  const [selectedStarters, setSelectedStarters] = useState<string[]>(starters);
  const [selectedSubs, setSelectedSubs] = useState<string[]>(substitutes);
  const [motm, setMotm] = useState<string>(manOfTheMatchId ?? "");

  const addGoalRow = () => setGoalRows((r) => [...r, { minute: 0, scorer_squad_id: "", assist_squad_id: "" }]);
  const removeGoalRow = (i: number) => setGoalRows((r) => r.filter((_, j) => j !== i));
  const updateGoalRow = (i: number, f: keyof GoalRow, v: number | string) =>
    setGoalRows((r) => r.map((row, j) => (j === i ? { ...row, [f]: v } : row)));

  const toggleStarter = (id: string) => {
    setSelectedStarters((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 11) return prev;
      return [...prev, id];
    });
  };
  const toggleSub = (id: string) => {
    setSelectedSubs((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    goalRows.forEach((row) => {
      if (row.scorer_squad_id) {
        formData.append("goal_minute", String(row.minute));
        formData.append("goal_scorer", row.scorer_squad_id);
        formData.append("goal_assist", row.assist_squad_id || "");
      }
    });
    selectedStarters.forEach((id) => formData.append("starter", id));
    selectedSubs.forEach((id) => formData.append("substitute", id));
    if (motm) formData.set("man_of_the_match_id", motm);
    const res = match ? await updateMatch(match.id, formData) : await createMatch(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: match ? "Maç güncellendi." : "Maç kaydedildi." } }));
    }
    router.push("/admin/maclar");
    router.refresh();
  }

  const dateValue = match?.match_date ? match.match_date.toString().slice(0, 10) : "";
  const selectClass = "mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-6">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-siyah">Rakip takım *</label>
          <input name="opponent_name" defaultValue={match?.opponent_name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Ev / Deplasman *</label>
          <select name="home_away" defaultValue={match?.home_away ?? "home"} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
            <option value="home">Ev (Güngören FK ev sahibi)</option>
            <option value="away">Deplasman (Güngören FK deplasman)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Maç tarihi *</label>
          <input name="match_date" type="date" defaultValue={dateValue} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Maç saati</label>
          <input name="match_time" type="text" defaultValue={match?.match_time ?? ""} placeholder="14:00" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Stadyum / Salon (yer)</label>
          <input name="venue" defaultValue={match?.venue ?? ""} placeholder="Güngören Stadyumu" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Rakip takım logosu (URL)</label>
          <input name="opponent_logo_url" type="url" defaultValue={match?.opponent_logo_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-siyah">Müsabaka (Lig)</label>
            <select name="competition" defaultValue={match?.competition ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
              <option value="">— Seçin —</option>
              {LIG_OPTIONS.map((lig) => (
                <option key={lig} value={lig}>{lig}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-siyah">Sezon</label>
            <select name="season" defaultValue={match?.season ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
              <option value="">— Seçin —</option>
              {SEZON_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
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
      </div>

      {/* Attığımız goller: dakika, atan, asist */}
      <div className="rounded-xl border border-siyah/10 bg-siyah/[0.02] p-4">
        <h3 className="text-sm font-semibold text-siyah">Attığımız goller (dakika, atan, asist)</h3>
        <p className="mt-0.5 text-xs text-siyah/60">Kadrodan seçin. Her gol için bir satır.</p>
        <div className="mt-3 space-y-2">
          {goalRows.map((row, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                value={row.minute || ""}
                onChange={(e) => updateGoalRow(i, "minute", e.target.value ? parseInt(e.target.value, 10) : 0)}
                placeholder="Dk"
                className="w-14 rounded border border-siyah/20 px-2 py-1.5 text-sm"
              />
              <select
                value={row.scorer_squad_id}
                onChange={(e) => updateGoalRow(i, "scorer_squad_id", e.target.value)}
                className={selectClass + " min-w-[140px]"}
              >
                <option value="">— Atan —</option>
                {squad.map((p) => (
                  <option key={p.id} value={p.id}>{p.shirt_number ? `${p.shirt_number}. ` : ""}{p.name}</option>
                ))}
              </select>
              <select
                value={row.assist_squad_id}
                onChange={(e) => updateGoalRow(i, "assist_squad_id", e.target.value)}
                className={selectClass + " min-w-[140px]"}
              >
                <option value="">— Asist (opsiyonel) —</option>
                {squad.map((p) => (
                  <option key={p.id} value={p.id}>{p.shirt_number ? `${p.shirt_number}. ` : ""}{p.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => removeGoalRow(i)} className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
                Kaldır
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addGoalRow} className="mt-2 text-sm font-medium text-bordo hover:underline">
          + Gol satırı ekle
        </button>
      </div>

      {/* İlk 11 */}
      <div className="rounded-xl border border-siyah/10 bg-siyah/[0.02] p-4">
        <h3 className="text-sm font-semibold text-siyah">İlk 11</h3>
        <p className="mt-0.5 text-xs text-siyah/60">En fazla 11 oyuncu. Kadrodan işaretleyin.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {squad.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded border border-siyah/15 px-3 py-1.5 hover:bg-siyah/5">
              <input
                type="checkbox"
                checked={selectedStarters.includes(p.id)}
                onChange={() => toggleStarter(p.id)}
                className="rounded"
              />
              <span className="text-sm">{p.shirt_number ? `${p.shirt_number}. ` : ""}{p.name}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-siyah/60">Seçili: {selectedStarters.length} / 11</p>
      </div>

      {/* Yedekler */}
      <div className="rounded-xl border border-siyah/10 bg-siyah/[0.02] p-4">
        <h3 className="text-sm font-semibold text-siyah">Yedek oyuncular</h3>
        <p className="mt-0.5 text-xs text-siyah/60">Kadrodan işaretleyin.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {squad.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded border border-siyah/15 px-3 py-1.5 hover:bg-siyah/5">
              <input
                type="checkbox"
                checked={selectedSubs.includes(p.id)}
                onChange={() => toggleSub(p.id)}
                className="rounded"
              />
              <span className="text-sm">{p.shirt_number ? `${p.shirt_number}. ` : ""}{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Maçın oyuncusu */}
      <div className="rounded-xl border border-siyah/10 bg-siyah/[0.02] p-4">
        <h3 className="text-sm font-semibold text-siyah">Maçın oyuncusu</h3>
        <p className="mt-0.5 text-xs text-siyah/60">Favori oyuncusu bu olan taraftarlar +%5 barem alır (en fazla 2 maç %10).</p>
        <select
          value={motm}
          onChange={(e) => setMotm(e.target.value)}
          className={selectClass + " mt-2"}
        >
          <option value="">— Seçin —</option>
          {squad.map((p) => (
            <option key={p.id} value={p.id}>{p.shirt_number ? `${p.shirt_number}. ` : ""}{p.name}</option>
          ))}
        </select>
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
