"use client";

import { useState } from "react";
import { updateNavVisibility } from "@/app/actions/admin";

type Props = {
  etkinliklerHidden: boolean;
  maclarHidden: boolean;
};

export function NavPasifForm({ etkinliklerHidden, maclarHidden }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<"ok" | "error" | null>(null);
  const [etkinlikler, setEtkinlikler] = useState(etkinliklerHidden);
  const [maclar, setMaclar] = useState(maclarHidden);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const formData = new FormData();
    formData.set("nav_etkinlikler_hidden", etkinlikler ? "1" : "0");
    formData.set("nav_maclar_hidden", maclar ? "1" : "0");
    try {
      await updateNavVisibility(formData);
      setMessage("ok");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Kaydedildi." } }));
      }
    } catch {
      setMessage("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-siyah/10 bg-beyaz p-6">
      <h2 className="text-lg font-bold text-siyah">Menü pasif tuşları</h2>
      <p className="mt-1 text-sm text-siyah/60">Aktif edilince ilgili menü öğesi sitede (üst menü ve footer) gizlenir.</p>
      <div className="mt-4 space-y-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={etkinlikler}
            onChange={(e) => setEtkinlikler(e.target.checked)}
            className="rounded border-siyah/30"
          />
          <span className="text-sm font-medium text-siyah">Etkinlikler pasif (gizle)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={maclar}
            onChange={(e) => setMaclar(e.target.checked)}
            className="rounded border-siyah/30"
          />
          <span className="text-sm font-medium text-siyah">Maçlar pasif (gizle)</span>
        </label>
      </div>
      {message === "ok" && <p className="mt-2 text-sm text-green-600">Kaydedildi.</p>}
      {message === "error" && <p className="mt-2 text-sm text-red-600">Kaydedilemedi.</p>}
      <button type="submit" disabled={saving} className="mt-4 rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-60">
        {saving ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
