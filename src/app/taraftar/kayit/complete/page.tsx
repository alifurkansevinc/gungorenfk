"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createFanProfileAfterSignup } from "@/app/actions/fan";
import type { FanProfileInput } from "@/app/actions/fan";

const STORAGE_KEY = "gungoren_pending_fan_profile";

export default function TaraftarKayitCompletePage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "missing">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let payload: FanProfileInput | null = null;
      try {
        const raw = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
        if (raw) payload = JSON.parse(raw) as FanProfileInput;
      } catch {
        if (mounted) setStatus("missing");
        return;
      }
      if (!payload || !payload.email) {
        if (mounted) setStatus("missing");
        return;
      }
      const result = await createFanProfileAfterSignup(payload);
      if (!mounted) return;
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
      if (result.error) {
        setErrorMessage(result.error);
        setStatus("error");
        return;
      }
      setStatus("success");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "missing") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8 text-center">
        <p className="text-siyah/80">Kayıt bilgisi bulunamadı. Lütfen formu tekrar doldurun.</p>
        <Link href="/taraftar/kayit" className="mt-4 inline-block rounded-lg bg-bordo px-6 py-3 font-medium text-beyaz hover:bg-bordo-dark transition-colors">
          Taraftar kayıt formuna git
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-bold text-red-800">Profil oluşturulamadı</h2>
          <p className="mt-2 text-red-700">{errorMessage}</p>
          <p className="mt-4 text-sm text-siyah/70">Hesabın oluşmuş olabilir. Giriş yapıp taraftar panelinden bilgilerini tamamlayabilir veya formu tekrar deneyebilirsin.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/taraftar/kayit" className="rounded-lg bg-bordo px-5 py-2.5 font-medium text-beyaz hover:bg-bordo-dark transition-colors">
              Tekrar dene
            </Link>
            <Link href="/taraftar" className="rounded-lg border border-siyah/20 px-5 py-2.5 font-medium text-siyah hover:bg-siyah/5 transition-colors">
              Taraftar girişi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border-2 border-bordo bg-bordo/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-bordo text-4xl text-beyaz">🏅</div>
          <h2 className="text-xl font-bold text-siyah">Güngören BFK Fanı Rozeti</h2>
          <p className="mt-2 text-siyah/80">Kaydın tamamlandı. Artık resmi taraftarımızsın!</p>
          <p className="mt-4 text-sm text-siyah/70">Maçlara gelerek ve mağazadan alışveriş yaparak rozetini büyütebilirsin (Beyaz → Bronz → Gümüş → Altın → Platinium).</p>
          <Link href="/taraftar" className="mt-6 inline-block rounded-lg bg-bordo px-6 py-3 font-medium text-beyaz hover:bg-bordo-dark transition-colors">
            Taraftar Paneline Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8 text-center">
      <p className="text-siyah/80">Kaydın tamamlanıyor...</p>
      <div className="mt-4 h-2 w-32 mx-auto rounded-full bg-siyah/10 overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-bordo animate-pulse" style={{ animationDuration: "1s" }} />
      </div>
    </div>
  );
}
