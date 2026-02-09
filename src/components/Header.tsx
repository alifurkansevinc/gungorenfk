"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
  { href: "/kulup", label: "Kulüp" },
  { href: "/kulup/yonetim-kurulu", label: "Yönetim Kurulu" },
  { href: "/maclar", label: "Maçlar" },
  { href: "/kadro", label: "Kadro" },
  { href: "/haberler", label: "Gelişmeler" },
  { href: "/magaza", label: "Mağaza" },
  { href: "/taraftar", label: "Taraftar" },
];

export function Header() {
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-siyah">
      {/* Üst ince şerit — Juventus tarzı secondary bar */}
      <div className="border-b border-beyaz/10">
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-medium uppercase tracking-wider text-beyaz/50">
            Resmi İnternet Sitesi
          </span>
        </div>
      </div>

      {/* Ana navigasyon — koyu arka plan, beyaz metin */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-beyaz/20 bg-bordo">
            {!logoError ? (
              <Image
                src="/logo.png"
                alt="Güngören FK"
                width={40}
                height={40}
                className="object-contain"
                unoptimized
                onError={() => setLogoError(true)}
              />
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-beyaz">
              G
            </span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-beyaz">
            Güngören FK
          </span>
        </Link>

        {/* Desktop nav — Juventus: ortada/sağda, büyük harf hissi, sade */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="px-4 py-3 text-sm font-semibold uppercase tracking-wider text-beyaz/90 transition-colors hover:bg-beyaz/10 hover:text-beyaz"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Sağ: CTA + mobil menü butonu */}
        <div className="flex items-center gap-2">
          <Link
            href="/taraftar/kayit"
            className="hidden rounded-sm bg-bordo px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-beyaz transition-colors hover:bg-bordo-dark md:inline-block"
          >
            Taraftar Ol
          </Link>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded text-beyaz md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menü"
          >
            {mobileOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobil menü — tam genişlik, koyu */}
      {mobileOpen && (
        <div className="border-t border-beyaz/10 bg-siyah px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="border-b border-beyaz/5 py-4 text-sm font-semibold uppercase tracking-wider text-beyaz hover:bg-beyaz/10"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/taraftar/kayit"
              className="mt-2 rounded-sm bg-bordo py-4 text-center text-sm font-bold uppercase tracking-wider text-beyaz"
              onClick={() => setMobileOpen(false)}
            >
              Taraftar Ol
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
