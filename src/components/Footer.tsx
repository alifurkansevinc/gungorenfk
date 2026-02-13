import Link from "next/link";

const columns = [
  {
    title: "Takım",
    links: [
      { href: "/maclar", label: "Sıralama & Maçlar" },
      { href: "/kadro", label: "Kadro" },
      { href: "/haberler", label: "Gelişmeler" },
    ],
  },
  {
    title: "Taraftar",
    links: [
      { href: "/taraftar/giris", label: "Giriş Yap" },
      { href: "/taraftar/kayit", label: "Taraftar Ol" },
      { href: "/benim-kosem", label: "Benim Köşem" },
      { href: "/magaza", label: "Mağaza" },
      { href: "/sepet", label: "Sepet" },
    ],
  },
  {
    title: "Kulüp",
    links: [
      { href: "/", label: "Anasayfa" },
      { href: "/kulup", label: "Kulübümüz" },
      { href: "/kulup/yonetim-kurulu", label: "Yönetim Kurulu" },
      { href: "/kulup/teknik-heyet", label: "Teknik Heyet" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-siyah text-beyaz">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo + slogan */}
          <div className="lg:col-span-1">
            <p className="font-display text-lg font-bold tracking-tight text-beyaz">Güngören FK</p>
            <p className="mt-2 text-sm text-white/70">Güngören Belediye Spor Kulübü</p>
          </div>
          {/* Sütunlar */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60">{col.title}</h3>
              <ul className="mt-4 space-y-2">
                {col.links.map(({ href, label }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-white/80 hover:text-beyaz transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/60">© {new Date().getFullYear()} Güngören FK. Tüm hakları saklıdır.</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/" className="text-white/60 hover:text-beyaz transition-colors">Gizlilik</Link>
            <Link href="/" className="text-white/60 hover:text-beyaz transition-colors">Kullanım koşulları</Link>
            <Link href="/" className="text-white/60 hover:text-beyaz transition-colors">İletişim</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
