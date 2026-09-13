"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { submitJobApplication } from "@/app/actions/job-applications";
import type { JobFormSettings } from "@/lib/job-form";

type Prefill = {
  fullName: string;
  email: string;
  birthYear: string;
};

type Props = {
  settings: JobFormSettings;
  signedIn: boolean;
  hasProfile: boolean;
  prefill?: Prefill | null;
  compact?: boolean;
};

export function JobApplicationForm({ settings, signedIn, hasProfile, prefill, compact }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!settings.is_active) {
    return (
      <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6 text-center shadow-sm">
        <p className="text-sm text-siyah/70">İş başvuruları şu an kapalı.</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="rounded-2xl border border-bordo/20 bg-bordo/[0.04] p-6 text-center shadow-sm">
        <p className="font-display text-lg font-bold text-siyah">Başvuru için giriş gerekli</p>
        <p className="mt-2 text-sm text-siyah/70">
          Formu doldurmak için taraftar hesabınla giriş yapman veya üye olman gerekir.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/taraftar/giris?redirect=/is-basvuru"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-bordo px-5 py-2.5 text-sm font-bold text-beyaz hover:bg-bordo-dark"
          >
            Giriş Yap
          </Link>
          <Link
            href="/taraftar/kayit?redirect=/is-basvuru"
            className="inline-flex min-h-[44px] items-center rounded-xl border border-siyah/20 px-5 py-2.5 text-sm font-semibold text-siyah hover:bg-siyah/5"
          >
            Taraftar Ol
          </Link>
        </div>
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-center shadow-sm">
        <p className="font-semibold text-siyah">Profilini tamamla</p>
        <p className="mt-2 text-sm text-siyah/70">Başvuru için taraftar profilinin dolu olması gerekir.</p>
        <Link
          href="/benim-kosem"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-bordo px-5 py-2.5 text-sm font-bold text-beyaz"
        >
          Benim Köşem
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm">
        <p className="font-display text-lg font-bold text-siyah">Teşekkürler</p>
        <p className="mt-2 text-sm leading-relaxed text-siyah/75">{settings.success_message}</p>
      </div>
    );
  }

  const field =
    "mt-1 w-full rounded-xl border border-siyah/20 bg-beyaz px-4 py-2.5 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo";

  return (
    <form
      className={`rounded-2xl border border-siyah/10 bg-beyaz shadow-sm ${compact ? "p-5 sm:p-6" : "p-6 sm:p-8"}`}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await submitJobApplication(fd);
          if ("error" in res) {
            setError(res.error);
            return;
          }
          setDone(true);
        });
      }}
    >
      {!compact && (
        <div className="mb-6">
          <h2 className="font-display text-xl font-bold text-siyah">{settings.title}</h2>
          {settings.subtitle ? <p className="mt-1 text-sm text-bordo font-medium">{settings.subtitle}</p> : null}
          {settings.description ? (
            <p className="mt-3 text-sm leading-relaxed text-siyah/70 whitespace-pre-line">{settings.description}</p>
          ) : null}
        </div>
      )}

      {error && <p className="mb-4 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-siyah" htmlFor="full_name">
            Ad soyad *
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            defaultValue={prefill?.fullName ?? ""}
            className={field}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="email">
            E-posta *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={prefill?.email ?? ""}
            className={field}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="phone">
            Telefon *
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="05xx xxx xx xx"
            className={field}
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="birth_year">
            Doğum yılı
          </label>
          <input
            id="birth_year"
            name="birth_year"
            type="number"
            min={1950}
            max={2011}
            defaultValue={prefill?.birthYear ?? ""}
            className={field}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah" htmlFor="city">
            Şehir
          </label>
          <input id="city" name="city" className={field} placeholder="İstanbul" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-siyah" htmlFor="position_applied">
            Başvurulan pozisyon *
          </label>
          <select id="position_applied" name="position_applied" required className={field} defaultValue="">
            <option value="" disabled>
              Seçin
            </option>
            {settings.positions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-siyah" htmlFor="education">
            Eğitim
          </label>
          <input id="education" name="education" className={field} placeholder="Okul / bölüm / mezuniyet" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-siyah" htmlFor="experience">
            Deneyim / özgeçmiş *
          </label>
          <textarea
            id="experience"
            name="experience"
            required
            rows={4}
            className={field}
            placeholder="Önceki işler, beceriler, ilgili deneyim…"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-siyah" htmlFor="message">
            Ek mesaj
          </label>
          <textarea id="message" name="message" rows={3} className={field} placeholder="İsteğe bağlı not" />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-bordo px-6 py-3 text-sm font-bold text-beyaz transition hover:bg-bordo-dark disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Gönderiliyor…" : "Başvuruyu gönder"}
      </button>
    </form>
  );
}
