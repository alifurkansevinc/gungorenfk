"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSquadMember, updateSquadMember } from "@/app/actions/admin";

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

export function SquadForm({ member }: { member?: SquadRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = member
      ? await updateSquadMember(member.id, formData)
      : await createSquadMember(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/kadro");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Ad Soyad *</label>
        <input name="name" defaultValue={member?.name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-siyah">Forma no</label>
          <input name="shirt_number" type="number" min={0} max={99} defaultValue={member?.shirt_number ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Pozisyon (görünen)</label>
          <input name="position" defaultValue={member?.position ?? ""} placeholder="Örn: Stoper" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Pozisyon kategorisi</label>
        <select name="position_category" defaultValue={member?.position_category ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
          <option value="">—</option>
          {POSITION_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görsel URL</label>
        <input name="photo_url" type="url" defaultValue={member?.photo_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Kısa biyografi</label>
        <textarea name="bio" defaultValue={member?.bio ?? ""} rows={2} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sezon</label>
        <input name="season" type="text" defaultValue={member?.season ?? ""} placeholder="Örn: 24-25 Şampiyon Kadromuz, 26-27 Sezon Kadrosu" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        <p className="mt-1 text-xs text-siyah/60">Aynı sezon metnini giren oyuncular sitede aynı blokta gösterilir. En son sezon en üstte, varsayılan açık.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={member?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={member?.is_active ?? true} className="rounded" />
          <span className="text-sm text-siyah">Aktif (kadroda göster)</span>
        </label>
        <label className="flex items-center gap-2">
          <input name="is_captain" type="checkbox" defaultChecked={member?.is_captain ?? false} className="rounded" />
          <span className="text-sm text-siyah">Kaptan</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">
          {member ? "Güncelle" : "Ekle"}
        </button>
        <Link href="/admin/kadro" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">
          İptal
        </Link>
      </div>
    </form>
  );
}
