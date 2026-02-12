"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createTechnicalStaff, updateTechnicalStaff } from "@/app/actions/admin";
import { TECHNICAL_STAFF_ROLE_LABELS } from "@/lib/board-labels";

const ROLE_SLUGS = Object.keys(TECHNICAL_STAFF_ROLE_LABELS);

type Row = { id: string; name: string; role_slug: string; photo_url: string | null; sort_order: number; is_active: boolean };

export function TechnicalStaffForm({ member }: { member?: Row | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = member ? await updateTechnicalStaff(member.id, formData) : await createTechnicalStaff(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/teknik-heyet");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Ad Soyad *</label>
        <input name="name" defaultValue={member?.name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görev *</label>
        <select name="role_slug" defaultValue={member?.role_slug ?? "yardimci_hoca"} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
          {ROLE_SLUGS.map((slug) => (
            <option key={slug} value={slug}>{TECHNICAL_STAFF_ROLE_LABELS[slug] ?? slug}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görsel URL</label>
        <input name="photo_url" type="url" defaultValue={member?.photo_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={member?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={member?.is_active ?? true} className="rounded" />
          <span className="text-sm text-siyah">Aktif (sitede göster)</span>
        </label>
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">{member ? "Güncelle" : "Ekle"}</button>
        <Link href="/admin/teknik-heyet" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">İptal</Link>
      </div>
    </form>
  );
}
