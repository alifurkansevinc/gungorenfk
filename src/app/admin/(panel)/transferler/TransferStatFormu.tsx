"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addTransferSeasonStat } from "@/app/actions/admin";

export function TransferStatFormu({ transferId }: { transferId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await addTransferSeasonStat(transferId, formData);
    if (res?.error) {
      setError(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-siyah/10 bg-siyah/5 p-4">
      {error && <p className="w-full rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div className="min-w-[100px]">
        <label className="block text-xs font-medium text-siyah">Sezon</label>
        <input name="season_label" required placeholder="2024-25" className="mt-1 w-full rounded border border-siyah/20 px-2 py-1.5 text-sm" />
      </div>
      <div className="min-w-[70px]">
        <label className="block text-xs font-medium text-siyah">Maç</label>
        <input name="matches_played" type="number" min={0} defaultValue={0} className="mt-1 w-full rounded border border-siyah/20 px-2 py-1.5 text-sm" />
      </div>
      <div className="min-w-[70px]">
        <label className="block text-xs font-medium text-siyah">Gol</label>
        <input name="goals" type="number" min={0} defaultValue={0} className="mt-1 w-full rounded border border-siyah/20 px-2 py-1.5 text-sm" />
      </div>
      <div className="min-w-[70px]">
        <label className="block text-xs font-medium text-siyah">Asist</label>
        <input name="assists" type="number" min={0} defaultValue={0} className="mt-1 w-full rounded border border-siyah/20 px-2 py-1.5 text-sm" />
      </div>
      <div className="min-w-[60px]">
        <label className="block text-xs font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={0} className="mt-1 w-full rounded border border-siyah/20 px-2 py-1.5 text-sm" />
      </div>
      <button type="submit" className="rounded bg-bordo px-3 py-1.5 text-sm font-medium text-beyaz hover:bg-bordo-dark">Ekle</button>
    </form>
  );
}
