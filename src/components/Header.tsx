"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const [logoError, setLogoError] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-beyaz/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-bordo">
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
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-beyaz">G</span>
          </div>
          <span className="font-bold text-siyah sm:text-lg">Güngören FK</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Anasayfa</Link>
          <Link href="/maclar" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Maçlar</Link>
          <Link href="/kadro" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Kadro</Link>
          <Link href="/haberler" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Haberler</Link>
          <Link href="/galeri" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Galeri</Link>
          <Link href="/magaza" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Mağaza</Link>
          <Link href="/taraftar/kayit" className="rounded-md bg-bordo px-3 py-1.5 text-sm font-medium text-beyaz hover:bg-bordo-dark transition-colors">Taraftar Ol</Link>
          <Link href="/taraftar" className="text-sm font-medium text-siyah/80 hover:text-bordo transition-colors">Taraftar Paneli</Link>
        </nav>
      </div>
    </header>
  );
}
