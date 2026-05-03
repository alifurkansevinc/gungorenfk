import Link from "next/link";
import { getMackolikFixtureUrl } from "@/lib/data";
import { getAdminSupabase } from "../../actions";
import { MacSilButton } from "./MacSilButton";
import { MacPasifToggle } from "./MacPasifToggle";
import { MackolikImportButton } from "./MackolikImportButton";
import { MackolikLinkForm } from "./MackolikLinkForm";
import { sortSeasonLabelsDesc, resolveSeasonQueryParam } from "@/lib/seasons";

export default async function AdminMaclarPage({ searchParams }: { searchParams: Promise<{ sezon?: string }> }) {
  const sp = await searchParams;
  const [supabase, mackolikUrl] = await Promise.all([getAdminSupabase(), getMackolikFixtureUrl()]);
  const { data: seasonRows } = await supabase.from("matches").select("season");
  const seasonList = sortSeasonLabelsDesc(
    (seasonRows ?? []).map((r) => (r as { season: string | null }).season).filter((s): s is string => !!s?.trim()),
  );
  const { filter } = resolveSeasonQueryParam(sp?.sezon, seasonList);
  const showAllSeasons = sp?.sezon?.trim() === "tumu";

  let mq = supabase
    .from("matches")
    .select("id, opponent_name, match_date, goals_for, goals_against, status, home_away, competition, is_hidden, season")
    .order("match_date", { ascending: false });
  if (filter !== "all") {
    mq = mq.eq("season", filter);
  }
  const { data: matches } = await mq;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Maçlar</h1>
          <p className="mt-1 text-siyah/70">
            Maç ekle/düzenle veya Mackolik fikstüründen içe aktar. Her maça <strong>sezon</strong> etiketi verin; site fikstürü varsayılan
            olarak en güncel sezonu listeler. Pasif maç sitede görünmez.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MackolikImportButton />
          <Link
            href="/admin/maclar/haftanin-oyuncusu"
            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100"
          >
            Haftanın oyuncusu
          </Link>
          <Link href="/admin/maclar/yeni" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
            + Yeni maç
          </Link>
        </div>
      </div>

      {seasonList.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-siyah/10 bg-siyah/[0.02] px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-siyah/50">Sezon filtresi</span>
          {seasonList.map((s) => {
            const on = !showAllSeasons && filter === s;
            return (
              <Link
                key={s}
                href={`/admin/maclar?sezon=${encodeURIComponent(s)}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-siyah text-beyaz" : "bg-beyaz text-siyah ring-1 ring-siyah/15 hover:bg-siyah/5"}`}
              >
                {s}
              </Link>
            );
          })}
          <Link
            href="/admin/maclar?sezon=tumu"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${showAllSeasons ? "bg-bordo text-beyaz" : "bg-beyaz text-siyah ring-1 ring-siyah/15 hover:bg-siyah/5"}`}
          >
            Tümü
          </Link>
        </div>
      )}

      <div className="mt-6">
        <MackolikLinkForm initialUrl={mackolikUrl} />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Tarih</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Maç</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sezon</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Müsabaka</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sonuç</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Pasif</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {!matches || matches.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-siyah/60">
                  {seasonList.length > 0
                    ? "Bu filtreye uygun maç yok. Sezon seçin veya «Tümü»."
                    : 'Henüz maç yok. «Yeni maç» ile ekleyin (sezon alanını doldurmayı unutmayın).'}
                </td>
              </tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 text-siyah/80">{new Date(m.match_date).toLocaleDateString("tr-TR")}</td>
                  <td className="px-4 py-3 font-medium text-siyah">
                    {m.home_away === "home" ? "Güngören FK - " : ""}
                    {m.opponent_name}
                    {m.home_away === "away" ? " - Güngören FK" : ""}
                  </td>
                  <td className="px-4 py-3 text-siyah/70">{(m as { season?: string | null }).season ?? "—"}</td>
                  <td className="px-4 py-3 text-siyah/70">{m.competition ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold text-bordo">
                    {m.status === "finished" && m.goals_for != null && m.goals_against != null
                      ? `${m.goals_for} - ${m.goals_against}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-siyah/70">{m.status}</td>
                  <td className="px-4 py-3">
                    <MacPasifToggle id={m.id} isHidden={!!(m as { is_hidden?: boolean }).is_hidden} />
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/admin/maclar/duzenle/${m.id}`} className="text-bordo font-medium hover:underline">
                      Düzenle
                    </Link>
                    <MacSilButton
                      id={m.id}
                      label={`${m.home_away === "home" ? "Güngören FK - " : ""}${m.opponent_name}${m.home_away === "away" ? " - Güngören FK" : ""}`}
                    />
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
