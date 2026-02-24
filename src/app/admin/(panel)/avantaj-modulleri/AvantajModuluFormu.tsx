"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBenefitModule, updateBenefitModule } from "@/app/actions/admin";

type ModuleRow = {
  id: string;
  name: string;
  slug: string;
  value_type: string;
  unit_label: string | null;
  sort_order: number;
};

export function AvantajModuluFormu({ module }: { module?: ModuleRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = module
      ? await updateBenefitModule(module.id, formData)
      : await createBenefitModule(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: module ? "Modül güncellendi." : "Modül eklendi." } }));
    }
    router.push("/admin/avantaj-modulleri");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Ad *</label>
        <input name="name" defaultValue={module?.name ?? ""} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: Storedan indirim hakkı" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Slug *</label>
        <input name="slug" defaultValue={module?.slug ?? ""} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="store_discount" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Değer tipi *</label>
        <select name="value_type" defaultValue={module?.value_type ?? "number"} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
          <option value="percent">Oran (%)</option>
          <option value="number">Sayı (adet vb.)</option>
          <option value="boolean">Var / Yok</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Birim etiketi</label>
        <input name="unit_label" defaultValue={module?.unit_label ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="%, adet/yılda, vb." />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={module?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">{module ? "Güncelle" : "Ekle"}</button>
        <Link href="/admin/avantaj-modulleri" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">İptal</Link>
      </div>
    </form>
  );
}
