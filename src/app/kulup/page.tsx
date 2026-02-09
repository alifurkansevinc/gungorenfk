import Link from "next/link";
import { FadeInSection } from "@/components/FadeInSection";

export default function KulupPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Hero */}
      <section className="bg-siyah py-16 sm:py-24 text-beyaz">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-bordo">
            Kulüp
          </p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Güngören Belediye Spor Kulübü
          </h1>
          <p className="mt-4 text-beyaz/80">
            Güngören&apos;in resmi futbol kulübü. Tarihçemiz, değerlerimiz ve yönetimimiz.
          </p>
        </div>
      </section>

      <FadeInSection>
        <section className="border-b border-siyah/10 bg-beyaz py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-display text-2xl font-bold text-siyah">Hakkımızda</h2>
            <div className="mt-6 space-y-4 text-siyah/85 leading-relaxed">
              <p>
                Güngören Belediye Spor Kulübü, İstanbul Güngören ilçesinin resmi futbol takımıdır. 
                Bölgesel Amatör Lig ve alt kategorilerde mücadele eden kulübümüz, bölge sporuna ve 
                taraftar ailesine güç katmak için çalışmaktadır.
              </p>
              <p>
                Kulüp olarak amacımız; genç yeteneklere fırsat sunmak, taraftarımızla birlikte 
                büyümek ve Güngören&apos;i Türk futbolunda temsil etmektir.
              </p>
            </div>
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <section className="border-b border-siyah/10 bg-[#f8f8f8] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-2xl font-bold text-siyah">Kulüp yapısı</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <Link
                href="/kulup/yonetim-kurulu"
                className="group flex items-center gap-4 rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm transition-all hover:border-bordo/30 hover:shadow-md"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-bordo/10 text-bordo">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-siyah group-hover:text-bordo transition-colors">Yönetim Kurulu</h3>
                  <p className="mt-1 text-sm text-siyah/60">Kulüp yönetimi ve görevliler</p>
                </div>
                <span className="ml-auto text-bordo opacity-0 transition-opacity group-hover:opacity-100">→</span>
              </Link>
              <div className="flex items-center gap-4 rounded-2xl border border-siyah/10 bg-beyaz p-6 opacity-90">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-siyah/5 text-siyah/50">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-siyah/70">Tarihçe</h3>
                  <p className="mt-1 text-sm text-siyah/50">Yakında eklenecek</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeInSection>

      <FadeInSection>
        <section className="bg-beyaz py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-sm text-siyah/60">Maçlar, kadro ve gelişmeler için</p>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              <Link href="/maclar" className="rounded-full bg-bordo px-6 py-3 text-sm font-bold text-beyaz hover:bg-bordo-dark transition-colors">
                Maçlar
              </Link>
              <Link href="/kadro" className="rounded-full border-2 border-siyah/20 px-6 py-3 text-sm font-bold text-siyah hover:bg-siyah/5 transition-colors">
                Kadro
              </Link>
              <Link href="/haberler" className="rounded-full border-2 border-siyah/20 px-6 py-3 text-sm font-bold text-siyah hover:bg-siyah/5 transition-colors">
                Gelişmeler
              </Link>
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
}
