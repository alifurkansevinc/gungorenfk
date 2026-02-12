"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateFanLevel } from "@/app/actions/admin";

type FanLevelRow = {
  id: number;
  name: string;
  slug: string;
  min_points: number;
  sort_order: number;
  description: string | null;
  target_store_spend: number | null;
  target_tickets: number | null;
  target_donation: number | null;
};

export function RozetFormu({ level }: { level: FanLevelRow }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await updateFanLevel(String(level.id), formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/rozet");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Kademe adı *</label>
        <input name="name" defaultValue={level.name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Slug *</label>
        <input name="slug" defaultValue={level.slug} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Min puan</label>
        <input name="min_points" type="number" min={0} defaultValue={level.min_points} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={level.sort_order} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Açıklama</label>
        <textarea name="description" defaultValue={level.description ?? ""} rows={2} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-siyah">Mağaza hedef (₺)</label>
          <input name="target_store_spend" type="number" min={0} step="0.01" defaultValue={level.target_store_spend ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Bilet hedef</label>
          <input name="target_tickets" type="number" min={0} defaultValue={level.target_tickets ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Bağış hedef (₺)</label>
          <input name="target_donation" type="number" min={0} step="0.01" defaultValue={level.target_donation ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">Güncelle</button>
        <Link href="/admin/rozet" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">İptal</Link>
      </div>
    </form>
  );
}
