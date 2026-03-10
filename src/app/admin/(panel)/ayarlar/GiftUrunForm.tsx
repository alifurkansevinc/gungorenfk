"use client";

import { useState } from "react";
import { updateGiftEligibleProducts } from "@/app/actions/admin";

type Product = { id: string; name: string; slug: string };

type Props = {
  products: Product[];
  selectedIds: string[];
};

export function GiftUrunForm({ products, selectedIds }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"ok" | "error" | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await updateGiftEligibleProducts(Array.from(selected));
    setSaving(false);
    setMessage(res.error ? "error" : "ok");
    if (!res.error && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Hediye ürünleri kaydedildi." } }));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-siyah/10 bg-beyaz p-6">
      <h2 className="text-lg font-bold text-siyah">Hediye hakkı ürünleri</h2>
      <p className="mt-1 text-sm text-siyah/60">Rozet hediye hakkı ile sadece burada seçtiğiniz ürünler alınabilsin. En az bir ürün seçin.</p>
      <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-siyah/10 p-3">
        {products.length === 0 ? (
          <p className="text-sm text-siyah/60">Mağazada ürün yok. Önce Mağaza bölümünden ürün ekleyin.</p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="rounded border-siyah/30"
                  />
                  <span className="text-sm text-siyah">{p.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
      {message === "ok" && <p className="mt-2 text-sm text-green-600">Kaydedildi.</p>}
      {message === "error" && <p className="mt-2 text-sm text-red-600">Kaydedilemedi.</p>}
      <button type="submit" disabled={saving || products.length === 0} className="mt-4 rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-60">
        {saving ? "Kaydediliyor…" : "Hediye ürünlerini kaydet"}
      </button>
    </form>
  );
}
