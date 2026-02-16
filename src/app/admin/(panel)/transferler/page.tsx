import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { TransferSilButton } from "./TransferSilButton";

export default async function AdminTransferlerPage() {
  const supabase = await getAdminSupabase();
  const { data: transfers } = await supabase
    .from("transfers")
    .select("id, player_name, from_team_name, to_team_name, transfer_date, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Transferler</h1>
          <p className="mt-1 text-siyah/70">Oyuncu transfer kayıtları ve sezon istatistikleri.</p>
        </div>
        <Link href="/admin/transferler/yeni" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo-dark min-touch">Yeni transfer</Link>
      </div>
      <div className="mt-6 space-y-2">
        {(!transfers || transfers.length === 0) ? (
          <p className="text-siyah/60">Henüz transfer kaydı yok.</p>
        ) : (
          transfers.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-black/10 bg-beyaz px-4 py-3">
              <div>
                <span className="font-medium">{t.player_name}</span>
                <span className="mx-2 text-siyah/50">→</span>
                <span className="text-siyah/80">{t.from_team_name}</span>
                <span className="mx-2 text-siyah/50">→</span>
                <span className="text-siyah/80">{t.to_team_name}</span>
                {t.transfer_date && (
                  <span className="ml-2 text-sm text-siyah/60">{new Date(t.transfer_date).toLocaleDateString("tr-TR")}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/transferler/duzenle/${t.id}`} className="text-sm text-siyah/80 hover:underline">Düzenle</Link>
                <Link href="/transferler" target="_blank" className="text-sm text-bordo hover:underline">Görüntüle</Link>
                <TransferSilButton id={t.id} playerName={t.player_name} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
