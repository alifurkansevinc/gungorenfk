"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTrophy, updateTrophy } from "@/app/actions/admin";
import type { ClubTrophy } from "@/types/db";

export function TrophyForm({ trophy }: { trophy?: ClubTrophy | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = trophy ? await updateTrophy(trophy.id, formData) : await createTrophy(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: trophy ? "Kupa güncellendi." : "Kupa eklendi." } }));
    }
    router.push("/admin/kupa-muzesi");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Kupa ismi *</label>
        <input name="name" defaultValue={trophy?.name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn. Şampiyonluk Kupası" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Yılı *</label>
        <input name="year" type="number" min={1900} max={2100} defaultValue={trophy?.year ?? new Date().getFullYear()} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Resim (URL)</label>
        <input name="image_url" type="url" defaultValue={trophy?.image_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Açıklama</label>
        <textarea name="description" defaultValue={trophy?.description ?? ""} rows={3} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Kupa hakkında kısa açıklama" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={trophy?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={trophy?.is_active ?? true} className="rounded" />
          <span className="text-sm text-siyah">Aktif (sitede göster)</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">{trophy ? "Güncelle" : "Ekle"}</button>
        <Link href="/admin/kupa-muzesi" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">İptal</Link>
      </div>
    </form>
  );
}
