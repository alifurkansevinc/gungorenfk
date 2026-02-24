"use client";

import { useRouter, useSearchParams } from "next/navigation";

const MONTHS_TR = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function AdminBagislarFilter({ currentAy }: { currentAy?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const options: { value: string; label: string }[] = [{ value: "", label: "Tümü" }];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    options.push({
      value: `${y}-${m}`,
      label: `${MONTHS_TR[d.getMonth()]} ${y}`,
    });
  }

  return (
    <div className="w-full">
      <label className="mb-1 block text-sm font-medium text-siyah/70">Dönem filtresi</label>
      <select
        value={currentAy ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          const next = new URLSearchParams(searchParams);
          if (v) next.set("ay", v);
          else next.delete("ay");
          router.push(`/admin/bagislar${next.toString() ? `?${next}` : ""}`);
        }}
        className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
