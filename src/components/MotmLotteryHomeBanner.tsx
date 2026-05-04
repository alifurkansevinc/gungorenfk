import { getHomeBannerMotmLottery } from "@/lib/motm-lottery-public";

const defaultRights =
  "Aşağıda isimleri yer alan taraftarlarımız, etkinliğe katılım veya ödül hakkı kazanmıştır. Kulüp ile iletişime geçerek süreci tamamlayabilirsiniz.";

/** Çekiliş tamamlanıp admin tarafından ana sayfada yayınlanan MOTM havuzu sonucu. */
export async function MotmLotteryHomeBanner() {
  const data = await getHomeBannerMotmLottery();
  if (!data) return null;

  return (
    <section className="border-b border-bordo/20 bg-gradient-to-r from-bordo via-bordo to-[#6b0f1a] py-6 text-beyaz">
      <div className="mx-auto max-w-5xl px-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-beyaz/70">Haftanın oyuncusu — çekiliş</p>
        <h2 className="font-display mt-2 text-xl font-bold tracking-tight sm:text-2xl">{data.title}</h2>
        {data.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-beyaz/90 whitespace-pre-wrap">{data.description}</p>
        ) : null}
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-beyaz/80">{defaultRights}</p>
        <ol className="mt-5 grid gap-2 sm:grid-cols-2">
          {data.winners.map((w) => (
            <li
              key={w.place}
              className="flex items-center gap-3 rounded-lg border border-beyaz/15 bg-beyaz/10 px-3 py-2.5 backdrop-blur-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-beyaz font-display text-sm font-bold text-bordo tabular-nums">
                {w.place}
              </span>
              <span className="min-w-0 font-medium leading-snug">{w.displayName}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
