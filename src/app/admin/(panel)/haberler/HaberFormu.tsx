"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createNews, updateNews } from "@/app/actions/admin";

type NewsRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  published_at: string | null;
  image_url: string | null;
};

export function HaberFormu({ news }: { news?: NewsRow | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = news ? await updateNews(news.id, formData) : await createNews(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/haberler");
    router.refresh();
  }

  const pubDate = news?.published_at ? new Date(news.published_at).toISOString().slice(0, 16) : "";

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Başlık *</label>
        <input name="title" defaultValue={news?.title} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Slug (URL)</label>
        <input name="slug" defaultValue={news?.slug} placeholder="otomatik üretilir" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Özet</label>
        <textarea name="excerpt" defaultValue={news?.excerpt ?? ""} rows={2} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">İçerik</label>
        <textarea name="body" defaultValue={news?.body ?? ""} rows={8} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Yayın tarihi</label>
        <input name="published_at" type="datetime-local" defaultValue={pubDate} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görsel URL</label>
        <input name="image_url" type="url" defaultValue={news?.image_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">
          {news ? "Güncelle" : "Ekle"}
        </button>
        <Link href="/admin/haberler" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">
          İptal
        </Link>
      </div>
    </form>
  );
}
