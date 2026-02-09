import { getMemleketCounts, TARGET_PER_CITY } from "@/lib/data";

export async function AnadoluTemsilcisi() {
  const memleketCounts = await getMemleketCounts();

  return (
    <section className="border-y border-siyah/10 bg-siyah py-14 sm:py-20 text-beyaz">
      <div className="mx-auto max-w-4xl px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-beyaz/50">Kampanya</p>
        <h2 className="mt-1 text-2xl font-bold">Anadolu Temsilcisi</h2>
        <p className="mt-3 max-w-xl text-beyaz/80">
          1000 Taraftar 1 Bayrak — Memleketinden 1000 taraftar üye olursa Güngören Stadyumu&apos;nda bayrağın dalgalanır.
        </p>
        <div className="mt-10 space-y-5">
          {memleketCounts.length === 0 ? (
            <p className="text-beyaz/60">Henüz kayıtlı memleket yok. İlk taraftar sen ol!</p>
          ) : (
            memleketCounts.map(({ city_id, city_name, count }) => {
              const percent = Math.min(100, (count / TARGET_PER_CITY) * 100);
              return (
                <div key={city_id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-beyaz">{city_name}</span>
                    <span className="text-beyaz/70">{count} / {TARGET_PER_CITY}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-beyaz/20">
                    <div
                      className="progress-fill h-full rounded-full bg-bordo"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
