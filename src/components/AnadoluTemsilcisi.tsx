import { getMemleketCounts, TARGET_PER_CITY } from "@/lib/data";

export async function AnadoluTemsilcisi() {
  const memleketCounts = await getMemleketCounts();

  return (
    <section className="bg-siyah text-beyaz py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Anadolu Temsilcisi</h2>
        <p className="mt-2 text-sm text-white/80 sm:text-base">
          1000 Taraftar 1 Bayrak — Memleketinden 1000 taraftar üye olursa Güngören Stadyumu&apos;nda bayrağın dalgalanır.
        </p>
        <div className="mt-8 space-y-6">
          {memleketCounts.length === 0 ? (
            <p className="text-white/60">Henüz kayıtlı memleket yok. İlk taraftar sen ol!</p>
          ) : (
            memleketCounts.map(({ city_id, city_name, count }) => {
              const percent = Math.min(100, (count / TARGET_PER_CITY) * 100);
              return (
                <div key={city_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{city_name}</span>
                    <span className="text-white/80">{count} / {TARGET_PER_CITY}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-white/20">
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
