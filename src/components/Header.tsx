"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NAV_BASE = [
  { href: "/maclar", label: "Sıralama & Maçlar" },
  { href: "/magaza", label: "Mağaza" },
  { href: "/bagis", label: "Bağış Yap" },
  { href: "/biletler", label: "Maç Biletleri" },
  { href: "/kadro", label: "Kadro" },
  { href: "/kulup/teknik-heyet", label: "Teknik Heyet" },
  { href: "/kulup/yonetim-kurulu", label: "Yönetim Kurulu" },
  { href: "/haberler", label: "Etkinlikler" },
  { href: "/kulup", label: "Kulübümüz" },
] as const;

export function Header() {
  const [logoError, setLogoError] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setSignedIn(!!session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setSignedIn(!!session?.user)
    );
    return () => subscription.unsubscribe();
  }, []);

  const navLinks = signedIn
    ? [...NAV_BASE, { href: "/benim-kosem", label: "Benim Köşem" }]
    : [...NAV_BASE];

  return (
    <header className="sticky top-0 z-50 bg-siyah">
      <div className="border-b border-beyaz/10">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-end gap-4 px-4 sm:px-6 lg:px-8">
          {signedIn ? (
            <Link
              href="/benim-kosem"
              className="text-xs font-semibold uppercase tracking-wider text-bordo hover:text-beyaz transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Benim Köşem
            </Link>
          ) : (
            <>
              <Link
                href="/taraftar/giris"
                className="text-xs font-semibold uppercase tracking-wider text-beyaz/90 hover:text-beyaz transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Giriş Yap
              </Link>
              <Link
                href="/taraftar/kayit"
                className="text-xs font-semibold uppercase tracking-wider text-bordo hover:text-beyaz transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Taraftar Ol
              </Link>
            </>
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-beyaz/50">
            Resmi İnternet Sitesi
          </span>
        </div>
      </div>

      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          onClick={() => setMobileOpen(false)}
        >
          {!logoError ? (
            <Image
              src="/logogbfk.png"
              alt="Güngören FK"
              width={120}
              height={48}
              className="h-10 w-auto object-contain sm:h-12"
              unoptimized
              onError={() => setLogoError(true)}
              priority
            />
          ) : (
            <span className="font-display text-lg font-bold text-beyaz">Güngören FK</span>
          )}
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-end md:flex">
          <div className="flex items-center gap-0 overflow-x-auto overflow-y-hidden py-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href + label}
                href={href}
                className="shrink-0 whitespace-nowrap px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-beyaz/90 transition-colors hover:bg-beyaz/10 hover:text-beyaz sm:px-2.5 sm:text-xs"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-beyaz md:hidden"
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

      {mobileOpen && (
        <div className="border-t border-beyaz/10 bg-siyah px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-0">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href + label}
                href={href}
                className="border-b border-beyaz/5 py-4 text-sm font-semibold uppercase tracking-wider text-beyaz hover:bg-beyaz/10"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
            {signedIn ? (
              <Link
                href="/benim-kosem"
                className="mt-2 rounded-sm bg-bordo py-4 text-center text-sm font-bold uppercase tracking-wider text-beyaz"
                onClick={() => setMobileOpen(false)}
              >
                Benim Köşem
              </Link>
            ) : (
              <>
                <Link
                  href="/taraftar/giris"
                  className="border-b border-beyaz/5 py-4 text-sm font-semibold uppercase tracking-wider text-beyaz hover:bg-beyaz/10"
                  onClick={() => setMobileOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/taraftar/kayit"
                  className="mt-2 rounded-sm bg-bordo py-4 text-center text-sm font-bold uppercase tracking-wider text-beyaz"
                  onClick={() => setMobileOpen(false)}
                >
                  Taraftar Ol
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
