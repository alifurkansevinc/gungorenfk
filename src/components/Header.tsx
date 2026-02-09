"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const navLinks = [
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
    <header className="sticky top-0 z-50 border-b border-siyah/10 bg-beyaz">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full bg-bordo">
            {!logoError ? (
              <Image
                src="/logo.png"
                alt="Güngören FK"
                width={36}
                height={36}
                className="object-contain"
                unoptimized
                onError={() => setLogoError(true)}
              />
            ) : null}
            <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-beyaz">G</span>
          </div>
          <span className="font-bold tracking-tight text-siyah sm:text-lg">Güngören FK</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">
              {label}
            </Link>
          ))}
          <Link
            href="/taraftar/kayit"
            className="rounded bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark transition-colors"
          >
            Taraftar Ol
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded md:hidden text-siyah"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Menü"
        >
          {mobileOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t border-siyah/10 bg-beyaz px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="py-2 text-sm font-medium text-siyah hover:text-bordo" onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/taraftar/kayit" className="mt-2 rounded bg-bordo px-4 py-3 text-center font-semibold text-beyaz" onClick={() => setMobileOpen(false)}>
              Taraftar Ol
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
