"use client";

import { useState } from "react";
import { updateMackolikFixtureUrl } from "@/app/actions/admin";
import { Link2 } from "lucide-react";

export function MackolikLinkForm({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<"ok" | "error" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await updateMackolikFixtureUrl(url);
      if ("error" in res) {
        setMessage("error");
        return;
      }
      setMessage("ok");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 rounded-lg border border-siyah/10 bg-siyah/[0.02] p-4">
      <div className="min-w-0 flex-1">
        <label htmlFor="mackolik-url" className="mb-1 block text-xs font-medium text-siyah/70">
          Mackolik fikstür linki
        </label>
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 shrink-0 text-siyah/50" />
          <input
            id="mackolik-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.mackolik.com/takim/..."
            className="min-w-0 flex-1 rounded border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah placeholder:text-siyah/40"
          />
        </div>
        <p className="mt-1 text-xs text-siyah/60">
          Link değişirse buraya yapıştırıp kaydedin. Sayfa yapısı aynıysa içe aktarma ve skor çekme aynı şekilde çalışır.
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-lg bg-siyah px-4 py-2 text-sm font-medium text-beyaz hover:bg-siyah/90 disabled:opacity-50"
      >
        {loading ? "Kaydediliyor…" : "Linki kaydet"}
      </button>
      {message === "ok" && <span className="text-sm text-emerald-600">Link kaydedildi.</span>}
      {message === "error" && <span className="text-sm text-red-600">Kaydedilemedi.</span>}
    </form>
  );
}
