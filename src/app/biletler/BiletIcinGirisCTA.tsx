"use client";

import Link from "next/link";
import { Ticket, LogIn, UserPlus } from "lucide-react";

type Props = {
  variant?: "card" | "inline";
};

/** Bilet almak için giriş/kayıt çağrısı — misafir kullanıcıya gösterilir. */
export function BiletIcinGirisCTA({ variant = "card" }: Props) {
  if (variant === "card") {
    return (
      <div className="rounded-2xl border-2 border-bordo/30 bg-gradient-to-br from-bordo/10 via-beyaz to-bordo/5 p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bordo/20 text-bordo">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-siyah">Taraftar girişi yapmadan bilet alınamaz</h3>
              <p className="mt-1 text-sm text-siyah/70">
                Maç ve etkinlik biletleri yalnızca kayıtlı taraftarlarımız için geçerlidir. Giriş yapın veya ücretsiz taraftar kaydı oluşturun.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href="/taraftar/kayit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-bordo px-6 py-3.5 text-sm font-bold text-beyaz shadow-md transition-all hover:bg-bordo/90 hover:shadow-lg"
            >
              <UserPlus className="h-5 w-5" />
              Kayıt ol
            </Link>
            <Link
              href="/taraftar/giris?redirect=/biletler"
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-siyah/20 bg-beyaz px-6 py-3.5 text-sm font-bold text-siyah transition-all hover:bg-siyah/5"
            >
              <LogIn className="h-5 w-5" />
              Giriş yap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-bordo/20 bg-bordo/5 px-4 py-3">
      <span className="text-sm font-medium text-siyah/80">Bilet almak için giriş yapın.</span>
      <div className="flex gap-2">
        <Link
          href="/taraftar/kayit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-bordo px-4 py-2 text-xs font-semibold text-beyaz hover:bg-bordo/90"
        >
          <UserPlus className="h-4 w-4" />
          Kayıt ol
        </Link>
        <Link
          href="/taraftar/giris?redirect=/biletler"
          className="inline-flex items-center gap-1.5 rounded-lg border border-siyah/20 px-4 py-2 text-xs font-semibold text-siyah hover:bg-siyah/5"
        >
          <LogIn className="h-4 w-4" />
          Giriş yap
        </Link>
      </div>
    </div>
  );
}
