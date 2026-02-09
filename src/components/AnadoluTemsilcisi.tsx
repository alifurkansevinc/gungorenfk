import Link from "next/link";
import { getMemleketCounts, getTotalFanCount, TARGET_PER_CITY } from "@/lib/data";
import { FadeInSection } from "@/components/FadeInSection";

export async function AnadoluTemsilcisi() {
  const [memleketCounts, { total, target }] = await Promise.all([
    getMemleketCounts(),
    getTotalFanCount(),
  ]);

  const totalPercent = Math.min(100, (total / target) * 100);
  const topCities = memleketCounts.slice(0, 6);
  const restCount = memleketCounts.length > 6 ? memleketCounts.length - 6 : 0;

  return (
    <FadeInSection>
      <section id="taraftar-bar" className="relative overflow-hidden border-y border-bordo/20 bg-gradient-to-b from-siyah via-siyah to-bordo/30 py-16 sm:py-24 text-beyaz">
        {/* Arka plan deseni */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_var(--bordo)_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,_transparent_0%,_var(--bordo)_100%)]" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-beyaz/20 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-6">
          {/* Toplam taraftar barı — ana vurgu */}
          <div className="rounded-2xl border border-beyaz/10 bg-beyaz/5 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-bordo">
              Taraftar ailesi
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold sm:text-3xl">
              Birlikte güçleniyoruz
            </h2>
            <p className="mt-2 text-sm text-beyaz/70">
              Kayıtlı taraftar sayımız artıyor. Sen de aramıza katıl!
            </p>
            <div className="mt-6 sm:mt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display text-3xl font-bold text-beyaz sm:text-4xl tabular-nums">
                  {total.toLocaleString("tr-TR")}
                </span>
                <span className="text-beyaz/60 font-medium">
                  / {target.toLocaleString("tr-TR")} taraftar hedefi
                </span>
              </div>
              <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-beyaz/20 shadow-inner">
                <div
                  className="progress-fill progress-bar-glow h-full rounded-full bg-gradient-to-r from-bordo to-bordo-dark"
                  style={{ width: `${totalPercent}%` }}
                />
              </div>
            </div>
            <Link
              href="/taraftar/kayit"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-bordo px-6 py-3 text-sm font-bold text-beyaz transition-all duration-300 hover:bg-bordo-dark hover:scale-[1.02] btn-glow"
            >
              Taraftar ol
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* 1000 Taraftar 1 Bayrak — iller */}
          <div className="mt-10 sm:mt-14">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-beyaz/50">
              Kampanya
            </p>
            <h3 className="font-display mt-1 text-xl font-bold text-beyaz">
              1000 Taraftar 1 Bayrak
            </h3>
            <p className="mt-2 max-w-xl text-sm text-beyaz/70">
              Memleketinden 1000 taraftar üye olursa Güngören Stadyumu&apos;nda bayrağın dalgalanır.
            </p>

            <div className="mt-8 space-y-4">
              {topCities.length === 0 ? (
                <p className="rounded-xl border border-beyaz/10 bg-beyaz/5 px-5 py-8 text-center text-beyaz/60">
                  Henüz kayıtlı memleket yok. İlk taraftar sen ol!
                </p>
              ) : (
                <>
                  {topCities.map(({ city_id, city_name, count }) => {
                    const percent = Math.min(100, (count / TARGET_PER_CITY) * 100);
                    return (
                      <div
                        key={city_id}
                        className="group rounded-xl border border-beyaz/10 bg-beyaz/5 px-4 py-3 transition-colors hover:bg-beyaz/10 sm:px-5 sm:py-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-beyaz">{city_name}</span>
                          <span className="text-sm tabular-nums text-beyaz/80">
                            {count.toLocaleString("tr-TR")} / {TARGET_PER_CITY.toLocaleString("tr-TR")}
                          </span>
                        </div>
                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-beyaz/20">
                          <div
                            className="progress-fill h-full rounded-full bg-bordo"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {restCount > 0 && (
                    <p className="text-center text-sm text-beyaz/50">
                      ve {restCount} il daha
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </FadeInSection>
  );
}
