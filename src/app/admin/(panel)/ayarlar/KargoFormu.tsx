"use client";

import { useState } from "react";
import { updateShippingSettings } from "@/app/actions/admin";

type Props = {
  initial: {
    freeShippingThreshold: number;
    standardShippingCost: number;
    estimatedDeliveryDays: string;
  };
};

export function KargoFormu({ initial }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState(initial);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("freeShippingThreshold", String(form.freeShippingThreshold));
    fd.set("standardShippingCost", String(form.standardShippingCost));
    fd.set("estimatedDeliveryDays", form.estimatedDeliveryDays);
    const result = await updateShippingSettings(fd);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
      <h2 className="font-semibold text-siyah">Kargo ayarları</h2>
      <p className="mt-1 text-sm text-siyah/60">Ödeme sayfasında ücretsiz kargo limiti ve kargo ücreti kullanılır.</p>
      {error && <p className="mt-4 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {success && <p className="mt-4 rounded bg-green-100 p-2 text-sm text-green-800">Kaydedildi.</p>}
      <div className="mt-6 grid gap-4">
        <div>
          <label htmlFor="freeShippingThreshold" className="block text-sm font-medium text-siyah">Ücretsiz kargo limiti (₺)</label>
          <input
            id="freeShippingThreshold"
            type="number"
            step="0.01"
            min="0"
            value={form.freeShippingThreshold}
            onChange={(e) => setForm((f) => ({ ...f, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-siyah"
          />
          <p className="mt-1 text-xs text-siyah/60">Bu tutar ve üzeri siparişlerde kargo ücretsiz.</p>
        </div>
        <div>
          <label htmlFor="standardShippingCost" className="block text-sm font-medium text-siyah">Standart kargo ücreti (₺)</label>
          <input
            id="standardShippingCost"
            type="number"
            step="0.01"
            min="0"
            value={form.standardShippingCost}
            onChange={(e) => setForm((f) => ({ ...f, standardShippingCost: parseFloat(e.target.value) ?? 0 }))}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-siyah"
          />
        </div>
        <div>
          <label htmlFor="estimatedDeliveryDays" className="block text-sm font-medium text-siyah">Tahmini teslimat süresi</label>
          <input
            id="estimatedDeliveryDays"
            type="text"
            value={form.estimatedDeliveryDays}
            onChange={(e) => setForm((f) => ({ ...f, estimatedDeliveryDays: e.target.value }))}
            placeholder="2-3"
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-siyah"
          />
          <p className="mt-1 text-xs text-siyah/60">Örn: 2-3, 3-5 iş günü</p>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-lg bg-bordo px-4 py-2 font-medium text-beyaz hover:bg-bordo-dark disabled:opacity-50"
      >
        {loading ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
