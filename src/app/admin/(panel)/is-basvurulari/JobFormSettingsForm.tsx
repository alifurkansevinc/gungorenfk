"use client";

import { useState, useTransition } from "react";
import { updateJobFormSettings } from "@/app/actions/job-applications";
import type { JobFormSettings } from "@/lib/job-form";

export function JobFormSettingsForm({ initial }: { initial: JobFormSettings }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [form, setForm] = useState(initial);

  return (
    <form
      className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setOk(false);
        const fd = new FormData(e.currentTarget);
        fd.set("is_active", form.is_active ? "true" : "false");
        fd.set("show_on_homepage", form.show_on_homepage ? "true" : "false");
        startTransition(async () => {
          const res = await updateJobFormSettings(fd);
          if ("error" in res) {
            setError(res.error);
            return;
          }
          setOk(true);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "İş formu ayarları kaydedildi." } }));
          }
        });
      }}
    >
      <h2 className="font-semibold text-siyah">Form ayarları</h2>
      <p className="mt-1 text-sm text-siyah/60">
        Anasayfa ve /is-basvuru sayfasındaki metinler, pozisyon listesi ve açık/kapalı durumu.
      </p>
      {error && <p className="mt-4 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {ok && <p className="mt-4 rounded bg-green-100 p-2 text-sm text-green-800">Kaydedildi.</p>}

      <div className="mt-6 flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-siyah">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="rounded border-siyah/30"
          />
          Form açık (başvuru alınır)
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-siyah">
          <input
            type="checkbox"
            checked={form.show_on_homepage}
            onChange={(e) => setForm((f) => ({ ...f, show_on_homepage: e.target.checked }))}
            className="rounded border-siyah/30"
          />
          Anasayfada göster
        </label>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="title">
            Başlık
          </label>
          <input
            id="title"
            name="title"
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="subtitle">
            Alt başlık
          </label>
          <input
            id="subtitle"
            name="subtitle"
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="description">
            Açıklama
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="positions">
            Pozisyonlar (her satıra bir)
          </label>
          <textarea
            id="positions"
            name="positions"
            rows={5}
            value={form.positions.join("\n")}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                positions: e.target.value.split(/\n/).map((p) => p.trim()).filter(Boolean),
              }))
            }
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="success_message">
            Başarı mesajı
          </label>
          <textarea
            id="success_message"
            name="success_message"
            rows={2}
            value={form.success_message}
            onChange={(e) => setForm((f) => ({ ...f, success_message: e.target.value }))}
            className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Ayarları kaydet"}
      </button>
    </form>
  );
}
