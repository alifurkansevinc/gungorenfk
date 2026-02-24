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
  advantages: string | null;
  target_store_spend: number | null;
  target_tickets: number | null;
  target_donation: number | null;
};

type BenefitModuleRow = {
  id: string;
  name: string;
  slug: string;
  value_type: string;
  unit_label: string | null;
  sort_order: number;
};

export function RozetFormu({
  level,
  modules = [],
  benefitByModule = {},
}: {
  level: FanLevelRow;
  modules?: BenefitModuleRow[];
  benefitByModule?: Record<string, number>;
}) {
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Rozet kuralı güncellendi." } }));
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
        <p className="mt-0.5 text-xs text-siyah/60">Bu kademeye ait puan eşiği. Şu an seviye atlama mağaza / bilet / bağış baremleri ile yapılıyor; min puan ileride birleşik puan sistemi kullanıldığında devreye alınabilir.</p>
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
      <div>
        <label className="block text-sm font-medium text-siyah">Bu rütbenin avantajları (serbest metin)</label>
        <p className="mt-0.5 text-xs text-siyah/60">Her satır bir madde olarak Benim Köşem’de listelenir. Modül avantajları aşağıda ayrıca atanır.</p>
        <textarea name="advantages" defaultValue={level.advantages ?? ""} rows={4} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: General'a doğru ilerleme hakkı" />
      </div>
      {modules.length > 0 && (
        <div className="rounded-xl border border-siyah/15 bg-siyah/[0.02] p-4">
          <h3 className="text-sm font-semibold text-siyah">Modül avantajları (oran / hak)</h3>
          <p className="mt-0.5 text-xs text-siyah/60">Bu rütbeye atanacak indirim, hediye, daimi koltuk vb. değerleri girin.</p>
          <div className="mt-3 space-y-3">
            {modules.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center gap-3">
                <label className="min-w-[180px] text-sm font-medium text-siyah">{m.name}</label>
                {m.value_type === "boolean" ? (
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name={`benefit_module_${m.id}`} value="1" defaultChecked={benefitByModule[m.id] === 1} className="rounded border-siyah/30" />
                    <span className="text-sm text-siyah/70">Var</span>
                  </label>
                ) : (
                  <input type="number" name={`benefit_module_${m.id}`} min={0} step={m.value_type === "percent" ? 1 : 0.01} defaultValue={benefitByModule[m.id] ?? ""} placeholder={m.value_type === "percent" ? "0-100" : "0"} className="w-24 rounded border border-siyah/20 px-3 py-2 text-sm" />
                )}
                {m.unit_label && <span className="text-sm text-siyah/60">{m.unit_label}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
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
