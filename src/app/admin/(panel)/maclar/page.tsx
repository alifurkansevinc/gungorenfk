import Link from "next/link";
import { getAdminSupabase } from "../../actions";

export default async function AdminMaclarPage() {
  const supabase = await getAdminSupabase();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, opponent_name, match_date, goals_for, goals_against, status, home_away, competition")
    .order("match_date", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Maçlar</h1>
          <p className="mt-1 text-siyah/70">Maç ekle/düzenle. Skor ve durum alanları.</p>
        </div>
        <Link href="/admin/maclar/yeni" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
          + Yeni maç
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Tarih</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Maç</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Müsabaka</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sonuç</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!matches || matches.length === 0) ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-siyah/60">Henüz maç yok. &quot;Yeni maç&quot; ile ekleyin.</td></tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 text-siyah/80">{new Date(m.match_date).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3 font-medium text-siyah">
                    {m.home_away === "home" ? "Güngören FK - " : ""}{m.opponent_name}{m.home_away === "away" ? " - Güngören FK" : ""}
                  </td>
                  <td className="px-4 py-3 text-siyah/70">{m.competition ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-bordo">
                    {m.status === "finished" && m.goals_for != null && m.goals_against != null
                      ? `${m.goals_for} - ${m.goals_against}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-siyah/70">{m.status}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/maclar/duzenle/${m.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
