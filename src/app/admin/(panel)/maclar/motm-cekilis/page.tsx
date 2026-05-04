import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";

const statusLabel: Record<string, string> = {
  draft: "Taslak",
  pool_ready: "Havuz hazır",
  drawn: "Çekiliş yapıldı",
};

export default async function MotmLotteryListPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getAdminSupabase();
  const { data: events, error } = await supabase
    .from("motm_lottery_events")
    .select("id, title, status, winner_count, pool_built_at, created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/maclar" className="text-sm text-bordo hover:underline">
            ← Maçlar
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-siyah">MOTM çekiliş havuzu</h1>
          <p className="mt-1 max-w-2xl text-sm text-siyah/70">
            Maçın oyuncusu oylamasına katılan üyelerden havuz oluşturup talihlileri belirleyin. Her etkinlik için başlık ve talihli
            sayısını siz verirsiniz; kaynak maçları ve çekiliş zamanını tam kontrol edersiniz.
          </p>
        </div>
        <Link
          href="/admin/maclar/motm-cekilis/yeni"
          className="shrink-0 rounded-lg bg-bordo px-4 py-2.5 text-sm font-semibold text-beyaz hover:bg-bordo-dark"
        >
          Yeni etkinlik
        </Link>
      </div>

      {sp.err && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-900">{decodeURIComponent(sp.err)}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-900">{error.message}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-siyah/10 bg-beyaz shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-2.5 font-medium text-siyah/70">Başlık</th>
              <th className="px-4 py-2.5 font-medium text-siyah/70">Durum</th>
              <th className="px-4 py-2.5 font-medium text-siyah/70">Talihli</th>
              <th className="px-4 py-2.5 font-medium text-siyah/70">Havuz</th>
              <th className="px-4 py-2.5 font-medium text-siyah/70" />
            </tr>
          </thead>
          <tbody>
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-siyah/50">
                  Henüz etkinlik yok. «Yeni etkinlik» ile başlayın.
                </td>
              </tr>
            )}
            {(events ?? []).map((e) => {
              const row = e as {
                id: string;
                title: string;
                status: string;
                winner_count: number;
                pool_built_at: string | null;
              };
              return (
                <tr key={row.id} className="border-t border-siyah/8">
                  <td className="px-4 py-3 font-medium text-siyah">{row.title}</td>
                  <td className="px-4 py-3 text-siyah/80">{statusLabel[row.status] ?? row.status}</td>
                  <td className="px-4 py-3 tabular-nums text-siyah/80">{row.winner_count}</td>
                  <td className="px-4 py-3 text-siyah/70">
                    {row.pool_built_at
                      ? new Date(row.pool_built_at).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/maclar/motm-cekilis/${row.id}`} className="text-bordo hover:underline">
                      Aç
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-siyah/55">
        Oylar <code className="rounded bg-siyah/10 px-1">match_motm_votes</code> tablosundan okunur; aynı üye birden fazla maçta oy
        kullanmışsa havuzda yine tek kişi olarak sayılır (maç sayısı kayıtta tutulur).
      </p>
    </div>
  );
}
