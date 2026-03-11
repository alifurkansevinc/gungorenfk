"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

type FilterProps = {
  currentAy?: string;
  baslangic?: string;
  bitis?: string;
  isim?: string;
  tutarMin?: string;
  tutarMax?: string;
};

export function AdminBagislarFilter({
  currentAy,
  baslangic,
  bitis,
  isim,
  tutarMin,
  tutarMax,
}: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value != null && value !== "") next.set(key, value);
      else next.delete(key);
    }
    router.push(`/admin/bagislar${next.toString() ? `?${next}` : ""}`);
  };

  const monthOptions: { value: string; label: string }[] = [{ value: "", label: "Tüm zamanlar" }];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    monthOptions.push({
      value: `${y}-${m}`,
      label: `${MONTHS_TR[d.getMonth()]} ${y}`,
    });
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 text-siyah/70">
        <Calendar className="h-5 w-5" />
        <span className="text-sm font-medium">Filtreler</span>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-siyah/70">Dönem (ay)</label>
        <select
          value={currentAy ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            updateParams({ ay: v || null, baslangic: null, bitis: null });
          }}
          className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
        >
          {monthOptions.map((o) => (
            <option key={o.value || "all"} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-siyah/70">Başlangıç</label>
          <input
            type="date"
            value={baslangic ?? ""}
            onChange={(e) => updateParams({ baslangic: e.target.value || null, ay: null })}
            className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-siyah/70">Bitiş</label>
          <input
            type="date"
            value={bitis ?? ""}
            onChange={(e) => updateParams({ bitis: e.target.value || null, ay: null })}
            className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-siyah/70">İsim (bağışçı / üye)</label>
        <input
          type="text"
          placeholder="İsim veya e-posta ara..."
          value={isim ?? ""}
          onChange={(e) => updateParams({ isim: e.target.value.trim() || null })}
          className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah placeholder:text-siyah/40 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-siyah/70">Tutar min (₺)</label>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="Min"
            value={tutarMin ?? ""}
            onChange={(e) => updateParams({ tutarMin: e.target.value.trim() || null })}
            className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah placeholder:text-siyah/40 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-siyah/70">Tutar max (₺)</label>
          <input
            type="number"
            min={0}
            step={1}
            placeholder="Max"
            value={tutarMax ?? ""}
            onChange={(e) => updateParams({ tutarMax: e.target.value.trim() || null })}
            className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah placeholder:text-siyah/40 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
      </div>

      {(currentAy || baslangic || bitis || isim || tutarMin || tutarMax) && (
        <button
          type="button"
          onClick={() => router.push("/admin/bagislar")}
          className="w-full rounded-lg border border-siyah/20 bg-siyah/5 py-2 text-sm font-medium text-siyah/80 hover:bg-siyah/10"
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}
