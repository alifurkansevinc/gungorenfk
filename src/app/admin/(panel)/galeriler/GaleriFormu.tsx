"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createGallery, updateGallery } from "@/app/actions/admin";

type GalleryRow = {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
};

export function GaleriFormu({ gallery }: { gallery?: GalleryRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = gallery ? await updateGallery(gallery.id, formData) : await createGallery(formData);
    if (res?.error) {
      setError(res.error);
      return;
    }
    const id = !gallery && res && "id" in res ? (res as { id?: string }).id : undefined;
    if (id) router.push(`/admin/galeriler/duzenle/${id}`);
    else router.push("/admin/galeriler");
    router.refresh();
  }

  const eventDate = gallery?.event_date ? String(gallery.event_date).slice(0, 10) : "";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Galeri başlığı *</label>
        <input name="title" defaultValue={gallery?.title} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: Esenler Erokspor maçı" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Slug (URL)</label>
        <input name="slug" defaultValue={gallery?.slug} placeholder="otomatik üretilir" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Etkinlik tarihi</label>
        <input name="event_date" type="date" defaultValue={eventDate} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo-dark min-touch">
          {gallery ? "Kaydet" : "Oluştur ve fotoğraf ekle"}
        </button>
        <Link href="/admin/galeriler" className="rounded border border-siyah/20 px-4 py-2 text-sm text-siyah hover:bg-black/5 min-touch">İptal</Link>
      </div>
    </form>
  );
}
