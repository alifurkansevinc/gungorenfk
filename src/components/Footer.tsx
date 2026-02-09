import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-black/10 bg-siyah text-beyaz">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p className="font-bold text-beyaz">Güngören FK</p>
            <p className="mt-1 text-sm text-white/70">Güngören Belediye Spor Kulübü</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link href="/" className="text-white/80 hover:text-beyaz transition-colors">Anasayfa</Link>
            <Link href="/maclar" className="text-white/80 hover:text-beyaz transition-colors">Maçlar</Link>
            <Link href="/kadro" className="text-white/80 hover:text-beyaz transition-colors">Kadro</Link>
            <Link href="/haberler" className="text-white/80 hover:text-beyaz transition-colors">Haberler</Link>
            <Link href="/galeri" className="text-white/80 hover:text-beyaz transition-colors">Galeri</Link>
            <Link href="/magaza" className="text-white/80 hover:text-beyaz transition-colors">Mağaza</Link>
            <Link href="/taraftar/kayit" className="text-white/80 hover:text-beyaz transition-colors">Taraftar Ol</Link>
          </nav>
        </div>
        <p className="mt-6 border-t border-white/10 pt-6 text-center text-sm text-white/60">
          © {new Date().getFullYear()} Güngören FK. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
