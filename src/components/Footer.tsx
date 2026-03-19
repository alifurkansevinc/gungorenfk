import Link from "next/link";

const columns = [
  {
    title: "Takım",
    links: [
      { href: "/maclar", label: "Sıralama & Maçlar" },
      { href: "/kadro", label: "Kadro" },
      { href: "/haberler", label: "Etkinlikler" },
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

const STORE_BASE = "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/store";

const PAYMENT_LOGOS = [
  { name: "Visa", src: `${STORE_BASE}/visa.svg` },
  { name: "Troy", src: `${STORE_BASE}/troy.svg` },
  { name: "Mastercard", src: `${STORE_BASE}/mastercard.svg` },
] as const;

export function Footer() {
  return (
    <footer className="bg-siyah text-beyaz">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <p className="font-display text-lg font-bold tracking-tight text-beyaz">Güngören FK</p>
            <p className="mt-2 text-sm text-white/70">Güngören Belediye Spor Kulübü</p>
          </div>
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

        <div className="mt-10 space-y-5 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-6 sm:gap-y-3">
            <p className="shrink-0 text-center text-sm text-white/60 sm:text-left">
              © {new Date().getFullYear()} Güngören FK. Tüm hakları saklıdır.
            </p>

            <nav
              className="flex max-w-full shrink-0 flex-nowrap items-center justify-center gap-x-5 overflow-x-auto whitespace-nowrap text-sm sm:justify-end"
              aria-label="Yasal ve iletişim"
            >
              <Link href="/mesafeli-satis-sozlesmesi" className="text-white/60 hover:text-beyaz transition-colors">
                Mesafeli satış
              </Link>
              <Link href="/gizlilik-sozlesmesi" className="text-white/60 hover:text-beyaz transition-colors">
                Gizlilik
              </Link>
              <Link href="/" className="text-white/60 hover:text-beyaz transition-colors">
                Kullanım koşulları
              </Link>
              <Link href="/" className="text-white/60 hover:text-beyaz transition-colors">
                İletişim
              </Link>
            </nav>
          </div>

          <div
            className="flex flex-nowrap items-center justify-center gap-8"
            role="img"
            aria-label="Visa, Troy ve Mastercard ile ödeme"
          >
            {PAYMENT_LOGOS.map(({ name, src }) => (
              <img
                key={name}
                src={src}
                alt={name}
                className="h-7 w-auto max-h-7 shrink-0 select-none object-contain sm:h-8 sm:max-h-8"
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
