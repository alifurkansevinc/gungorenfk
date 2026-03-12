"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Search, MapPin } from "lucide-react";

type FilterProps = {
  arama?: string;
  baslangic?: string;
  bitis?: string;
  memleket?: string;
  cityOptions: { id: number; name: string }[];
};

export function AdminTaraftarlarFilter({
  arama,
  baslangic,
  bitis,
  memleket,
  cityOptions,
}: FilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value != null && value !== "") next.set(key, value);
      else next.delete(key);
    }
    router.push(`/admin/taraftarlar${next.toString() ? `?${next}` : ""}`);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 text-siyah/70">
        <Calendar className="h-5 w-5" />
        <span className="text-sm font-medium">Filtreler</span>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-siyah/70">
          <Search className="h-3.5 w-3.5" />
          Ad, soyad veya e-posta
        </label>
        <input
          type="text"
          placeholder="Ara..."
          value={arama ?? ""}
          onChange={(e) => updateParams({ arama: e.target.value.trim() || null })}
          className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah placeholder:text-siyah/40 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-siyah/70">Kayıt başlangıç</label>
          <input
            type="date"
            value={baslangic ?? ""}
            onChange={(e) => updateParams({ baslangic: e.target.value || null })}
            className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-siyah/70">Kayıt bitiş</label>
          <input
            type="date"
            value={bitis ?? ""}
            onChange={(e) => updateParams({ bitis: e.target.value || null })}
            className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-siyah/70">
          <MapPin className="h-3.5 w-3.5" />
          Memleket
        </label>
        <select
          value={memleket ?? ""}
          onChange={(e) => updateParams({ memleket: e.target.value || null })}
          className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
        >
          <option value="">Tümü</option>
          {cityOptions.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {(arama || baslangic || bitis || memleket) && (
        <button
          type="button"
          onClick={() => router.push("/admin/taraftarlar")}
          className="w-full rounded-lg border border-siyah/20 bg-siyah/5 py-2 text-sm font-medium text-siyah/80 hover:bg-siyah/10"
        >
          Filtreleri temizle
        </button>
      )}
    </div>
  );
}
