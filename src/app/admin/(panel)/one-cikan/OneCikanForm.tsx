"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHomepageFeatured } from "@/app/actions/admin";
import type { FeaturedModuleKey } from "@/lib/featured-modules";

type ModuleOpt = { key: FeaturedModuleKey; label: string; link: string; defaultTitle: string; defaultSubtitle: string };

export function OneCikanForm({ availableModules }: { availableModules: ModuleOpt[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createHomepageFeatured(formData);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    form.reset();
  }

  if (availableModules.length === 0) return null;

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-xl border border-siyah/10 bg-beyaz p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-siyah">Yeni modül ekle</h2>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Modül *</label>
          <select name="module_key" required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
            {availableModules.map((m) => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Görsel URL *</label>
          <input name="image_url" type="url" required placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Başlık (isteğe bağlı)</label>
          <input name="title" type="text" placeholder="Varsayılan kullanılır" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Alt başlık (isteğe bağlı)</label>
          <input name="subtitle" type="text" placeholder="Varsayılan kullanılır" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_large" className="rounded border-siyah/30 text-bordo" />
            <span className="text-sm text-siyah">Büyük kart (2x2, sadece bir tane)</span>
          </label>
        </div>
      </div>
      <button type="submit" className="mt-4 rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 min-touch">Ekle</button>
    </form>
  );
}
