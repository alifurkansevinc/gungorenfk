"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSquadMember, updateSquadMember } from "@/app/actions/admin";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import {
  formatSeasonTabLabel,
  getFootballSeasonLabelForDate,
  toCanonicalSeasonKey,
} from "@/lib/football-season";

const POSITION_CATEGORIES = [
  { value: "kl", label: "Kaleci" },
  { value: "bek", label: "Bek" },
  { value: "stoper", label: "Stoper" },
  { value: "ortasaha", label: "Orta Saha" },
  { value: "kanat", label: "Kanat" },
  { value: "forvet", label: "Forvet" },
];

type SquadRow = {
  id: string;
  name: string;
  shirt_number: number | null;
  position: string | null;
  position_category: string | null;
  photo_url: string | null;
  bio: string | null;
  sort_order: number;
  is_active: boolean;
  is_captain: boolean;
  season: string | null;
};

function seasonSelectOptions(currentDefault: string): string[] {
  const y = parseInt(currentDefault.slice(0, 4), 10);
  const base = Number.isFinite(y) ? y : new Date().getFullYear();
  const keys: string[] = [];
  for (let i = 1; i >= -3; i--) {
    const sy = base + i;
    keys.push(`${sy}-${sy + 1}`);
  }
  return keys;
}

export function SquadForm({
  member,
  defaultSeason,
}: {
  member?: SquadRow | null;
  /** Yeni kayıt için varsayılan sezon (YYYY-YYYY) */
  defaultSeason?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const initialSeason =
    member?.season?.trim() ||
    (defaultSeason ? toCanonicalSeasonKey(defaultSeason) : getFootballSeasonLabelForDate(new Date()));

  const seasonOptions = seasonSelectOptions(
    toCanonicalSeasonKey(initialSeason) === "diger"
      ? getFootballSeasonLabelForDate(new Date())
      : toCanonicalSeasonKey(initialSeason),
  );

  // Mevcut serbest metin sezon seçeneklerde yoksa ekle
  const seasonValue = toCanonicalSeasonKey(initialSeason);
  if (seasonValue !== "diger" && !seasonOptions.includes(seasonValue)) {
    seasonOptions.unshift(seasonValue);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const rawSeason = String(formData.get("season") ?? "").trim();
    if (rawSeason) {
      formData.set("season", toCanonicalSeasonKey(rawSeason));
    }
    const res = member
      ? await updateSquadMember(member.id, formData)
      : await createSquadMember(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("admin-toast", {
          detail: {
            message: member ? "Kadro üyesi güncellendi." : "Kadro üyesi kaydedildi.",
          },
        }),
      );
    }
    router.push("/admin/kadro");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Ad Soyad *</label>
        <input
          name="name"
          defaultValue={member?.name}
          required
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-siyah">Forma no</label>
          <input
            name="shirt_number"
            type="number"
            min={0}
            max={99}
            defaultValue={member?.shirt_number ?? ""}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Pozisyon (görünen)</label>
          <input
            name="position"
            defaultValue={member?.position ?? ""}
            placeholder="Örn: Stoper"
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Pozisyon kategorisi</label>
        <select
          name="position_category"
          defaultValue={member?.position_category ?? ""}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
        >
          <option value="">—</option>
          {POSITION_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <AdminImageUpload
        name="photo_url"
        folder="squad"
        label="Fotoğraf"
        defaultValue={member?.photo_url}
        helperText="Oyuncu profil görseli; dosya yükleyebilir veya mevcut bir URL girebilirsiniz."
      />
      <div>
        <label className="block text-sm font-medium text-siyah">Kısa biyografi</label>
        <textarea
          name="bio"
          defaultValue={member?.bio ?? ""}
          rows={2}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sezon *</label>
        <select
          name="season"
          required
          defaultValue={seasonValue === "diger" ? getFootballSeasonLabelForDate(new Date()) : seasonValue}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
        >
          {seasonOptions.map((key) => (
            <option key={key} value={key}>
              {formatSeasonTabLabel(key)}
              {key === getFootballSeasonLabelForDate(new Date()) ? " (güncel)" : ""}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-siyah/50">
          Optaport ile aynı: 1 Haziran – 31 Mayıs, format YYYY-YYYY.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input
          name="sort_order"
          type="number"
          defaultValue={member?.sort_order ?? 0}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={member?.is_active ?? true}
            className="rounded"
          />
          <span className="text-sm text-siyah">Aktif (kadroda göster)</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            name="is_captain"
            type="checkbox"
            defaultChecked={member?.is_captain ?? false}
            className="rounded"
          />
          <span className="text-sm text-siyah">Kaptan</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90"
        >
          {member ? "Güncelle" : "Ekle"}
        </button>
        <Link
          href="/admin/kadro"
          className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
