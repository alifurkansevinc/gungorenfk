import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { TransferFormu } from "../../TransferFormu";
import { TransferStatFormu } from "../../TransferStatFormu";
import { TransferStatSilButton } from "../../TransferStatSilButton";

export default async function AdminTransferDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: transfer } = await supabase.from("transfers").select("*").eq("id", id).single();
  if (!transfer) notFound();
  const { data: stats } = await supabase
    .from("transfer_season_stats")
    .select("*")
    .eq("transfer_id", id)
    .order("sort_order", { ascending: true })
    .order("season_label", { ascending: false });

  return (
    <div>
      <Link href="/admin/transferler" className="text-sm text-bordo hover:underline">← Transferler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Transferi düzenle</h1>
      <TransferFormu transfer={transfer} />

      <section className="mt-10 border-t border-siyah/10 pt-8">
        <h2 className="text-lg font-semibold text-siyah">Sezon istatistikleri</h2>
        <p className="mt-1 text-sm text-siyah/60">Bu transfer için sezon bazında maç, gol ve asist girin.</p>
        <TransferStatFormu transferId={id} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[400px] border border-siyah/10 text-sm">
            <thead>
              <tr className="bg-siyah/5">
                <th className="border-b border-siyah/10 p-2 text-left font-medium">Sezon</th>
                <th className="border-b border-siyah/10 p-2 text-right font-medium">Maç</th>
                <th className="border-b border-siyah/10 p-2 text-right font-medium">Gol</th>
                <th className="border-b border-siyah/10 p-2 text-right font-medium">Asist</th>
                <th className="border-b border-siyah/10 p-2 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {(!stats || stats.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-siyah/50">Henüz sezon kaydı yok.</td>
                </tr>
              ) : (
                stats.map((s) => (
                  <tr key={s.id} className="border-b border-siyah/5">
                    <td className="p-2 font-medium">{s.season_label}</td>
                    <td className="p-2 text-right tabular-nums">{s.matches_played}</td>
                    <td className="p-2 text-right tabular-nums">{s.goals}</td>
                    <td className="p-2 text-right tabular-nums">{s.assists}</td>
                    <td className="p-2">
                      <TransferStatSilButton statId={s.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
