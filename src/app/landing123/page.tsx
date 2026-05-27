import Link from "next/link";

/**
 * Gizli kampanya / ön kayıt sayfası.
 * Ana siteden link verilmez; yalnızca tam URL ile erişilir (örn. gungorenspor.com/landing123).
 */
export default function Landing123Page() {
  return (
    <div className="relative -mx-[max(0px,calc(50vw-50%))] w-screen max-w-none bg-[#0c0c0c] text-beyaz">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,20,40,0.45),transparent)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-12rem)] max-w-2xl flex-col justify-center px-6 py-16 sm:py-24">
        <p className="font-display text-[10px] font-semibold uppercase tracking-[0.35em] text-beyaz/50">Güngören FK</p>
        <h1 className="font-display mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
          Taraftar ailesine katılın
        </h1>
        <p className="mt-6 text-base leading-relaxed text-beyaz/75">
          Maç günü atmosferi, kulüp haberleri ve özel etkinliklerden haberdar olun. Bu sayfa özel davet veya kampanya
          bağlantısı içindir; genel siteye buradan yönlendirme yoktur — dilerseniz ana siteyi yeni sekmede açabilirsiniz.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/taraftar/kayit"
            className="inline-flex rounded-full bg-bordo px-8 py-3.5 text-sm font-bold text-beyaz transition hover:bg-bordo-dark"
          >
            Taraftar kaydı
          </Link>
          <Link
            href="/"
            className="inline-flex rounded-full border border-beyaz/25 px-8 py-3.5 text-sm font-semibold text-beyaz/90 hover:bg-beyaz/10"
          >
            Ana sayfa
          </Link>
        </div>
        <p className="mt-14 text-xs text-beyaz/40">Bu sayfa arama motorlarında indexlenmez (noindex).</p>
      </div>
    </div>
  );
}
