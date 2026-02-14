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
  event_date: string | null;
  event_end_date: string | null;
  event_time: string | null;
  event_place: string | null;
  event_type: string | null;
  capacity: number | null;
  registration_url: string | null;
  is_online: boolean | null;
  external_link: string | null;
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
    router.push("/admin/haberler"); // route aynı, menüde Etkinlikler
    router.refresh();
  }

  const pubDate = news?.published_at ? new Date(news.published_at).toISOString().slice(0, 16) : "";
  const eventDate = news?.event_date ? String(news.event_date).slice(0, 10) : "";
  const eventEndDate = news?.event_end_date ? String(news.event_end_date).slice(0, 10) : "";
  const eventTypes = ["Konferans", "Söyleşi", "İmza günü", "Turnuva", "Kamp", "Özel gün", "Diyalog", "Festival", "Diğer"];

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Etkinlik başlığı *</label>
        <input name="title" defaultValue={news?.title} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Örn: Taraftar Söyleşisi" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Slug (URL)</label>
        <input name="slug" defaultValue={news?.slug} placeholder="otomatik üretilir" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Etkinlik tarihi</label>
          <input name="event_date" type="date" defaultValue={eventDate} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Bitiş tarihi</label>
          <input name="event_end_date" type="date" defaultValue={eventEndDate} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Saat</label>
          <input name="event_time" type="text" defaultValue={news?.event_time ?? ""} placeholder="Örn: 14:00" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Etkinlik tipi</label>
          <select name="event_type" defaultValue={news?.event_type ?? ""} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
            <option value="">Seçin</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Mekan / Adres</label>
          <input name="event_place" type="text" defaultValue={news?.event_place ?? ""} placeholder="Örn: Kulüp binası" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2">
            <input name="is_online" type="checkbox" defaultChecked={!!news?.is_online} className="rounded border-siyah/30" />
            <span className="text-sm font-medium text-siyah">Çevrimiçi etkinlik</span>
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-siyah">Kapasite (kişi)</label>
          <input name="capacity" type="number" min={0} defaultValue={news?.capacity ?? ""} placeholder="Boş bırakılabilir" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Kayıt / Bilet linki</label>
          <input name="registration_url" type="url" defaultValue={news?.registration_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Harici link (video, form vb.)</label>
        <input name="external_link" type="url" defaultValue={news?.external_link ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Kısa özet</label>
        <textarea name="excerpt" defaultValue={news?.excerpt ?? ""} rows={2} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" placeholder="Liste ve detayda görünür" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">İçerik / Açıklama</label>
        <textarea name="body" defaultValue={news?.body ?? ""} rows={8} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Yayın tarihi (sitede görünürlük)</label>
        <input name="published_at" type="datetime-local" defaultValue={pubDate} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Kapak görseli URL</label>
        <input name="image_url" type="url" defaultValue={news?.image_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo/90">
          {news ? "Güncelle" : "Etkinlik ekle"}
        </button>
        <Link href="/admin/haberler" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">
          İptal
        </Link>
      </div>
    </form>
  );
}
