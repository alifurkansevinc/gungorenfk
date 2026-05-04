import Link from "next/link";
import { createMotmLotteryEvent } from "@/app/actions/motm-lottery";

export default async function MotmLotteryYeniPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link href="/admin/maclar/motm-cekilis" className="text-sm text-bordo hover:underline">
          ← Çekiliş listesi
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-siyah">Yeni çekiliş etkinliği</h1>
        <p className="mt-1 text-sm text-siyah/70">
          Kaydedince etkinlik sayfasına yönlendirilirsiniz; orada hangi maçların oy kullananlarını havuza alacağınızı seçersiniz.
        </p>
      </div>

      {sp.err && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-900">{decodeURIComponent(sp.err)}</p>
      )}

      <form action={createMotmLotteryEvent} className="space-y-4 rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-siyah">Etkinlik başlığı *</label>
          <input
            name="title"
            required
            maxLength={200}
            placeholder="Örn. Beşiktaş maçı MOTM oylaması çekilişi"
            className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Açıklama (isteğe bağlı)</label>
          <textarea
            name="description"
            rows={3}
            maxLength={2000}
            className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-sm"
            placeholder="Ödül, teslim şekli veya kurallar…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Talihli sayısı *</label>
          <input
            name="winner_count"
            type="number"
            min={1}
            max={500}
            defaultValue={1}
            required
            className="mt-1 w-32 rounded-lg border border-siyah/20 px-3 py-2 text-sm tabular-nums"
          />
          <p className="mt-1 text-xs text-siyah/55">Havuzdaki üye sayısından fazla olamaz (çekiliş öncesi kontrol edilir).</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="rounded-lg bg-bordo px-5 py-2.5 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
            Oluştur ve devam et
          </button>
          <Link
            href="/admin/maclar/motm-cekilis"
            className="rounded-lg border border-siyah/20 px-5 py-2.5 text-sm font-medium text-siyah hover:bg-siyah/5"
          >
            Vazgeç
          </Link>
        </div>
      </form>
    </div>
  );
}
