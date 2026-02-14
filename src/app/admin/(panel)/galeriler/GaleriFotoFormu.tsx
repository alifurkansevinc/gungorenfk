"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addGalleryPhoto } from "@/app/actions/admin";

export function GaleriFotoFormu({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await addGalleryPhoto(galleryId, formData);
    if (res?.error) {
      setError(res.error);
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-wrap items-end gap-4 rounded-lg border border-siyah/10 bg-beyaz p-4">
      {error && <p className="w-full rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div className="min-w-[200px] flex-1">
        <label className="block text-sm font-medium text-siyah">Fotoğraf URL *</label>
        <input name="image_url" type="url" required placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm" />
      </div>
      <div className="min-w-[160px] flex-1">
        <label className="block text-sm font-medium text-siyah">Açıklama</label>
        <input name="caption" type="text" placeholder="Maç anı" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm" />
      </div>
      <button type="submit" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo-dark min-touch">Ekle</button>
    </form>
  );
}
