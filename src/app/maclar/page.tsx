import Link from "next/link";
import Image from "next/image";
import { getMatches, getLeagueStandings, getNextMatch } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { NextMatchCard } from "@/components/NextMatchCard";

export const metadata = {
  title: "Sıralama & Maçlar | Güngören FK",
  description: "Güngören FK maç programı, puan durumu ve sonuçları.",
};

export default async function MaclarPage() {
  const [matches, standings, nextMatch] = await Promise.all([
    getMatches(24),
    getLeagueStandings(),
    getNextMatch(),
  ]);
  const finished = matches.filter((m) => m.status === "finished");
  const scheduled = matches.filter((m) => m.status === "scheduled");

  return (
    <div className="min-h-screen">
      {/* Hero - tam genişlik görsel */}
      <section className="relative h-[14vh] min-h-[100px] flex items-end bg-siyah">
        <Image src={DEMO_IMAGES.stadium} alt="" fill className="object-cover opacity-80" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/50 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-beyaz sm:text-3xl">Sıralama & Maçlar</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Önümüzdeki maç — admin panelinden belirlenir; tek büyük kart */}
        <NextMatchCard match={nextMatch} />

        {/* Puan durumu (Mackolik kaynaklı) - sonraki maçın altında */}
        {standings.rows.length > 0 && (
          <section className="mb-14">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-4">Puan durumu</h2>
            <p className="text-sm text-siyah/70 mb-3">
              {standings.league_name} — {standings.season}
              {standings.updated_at && (
                <span className="ml-2">(Son güncelleme: {new Date(standings.updated_at).toLocaleDateString("tr-TR")})</span>
              )}
            </p>
            <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-siyah/10 bg-siyah/5">
                      <th className="px-4 py-3 font-semibold text-siyah/70">#</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70">Takım</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">O</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">G</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">B</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">M</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">A</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">Y</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">Av</th>
                      <th className="px-4 py-3 font-semibold text-siyah/70 text-center">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.rows.map((r) => (
                      <tr
                        key={r.position}
                        className={`border-b border-siyah/5 ${r.team_name.toLowerCase().includes("güngören") || r.team_name.toLowerCase().includes("gungoren") ? "bg-bordo/5 font-semibold" : "hover:bg-siyah/[0.02]"}`}
                      >
                        <td className="px-4 py-3 text-siyah/80">{r.position}</td>
                        <td className="px-4 py-3 font-medium text-siyah">{r.team_name}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.played}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.wins}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.draws}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.losses}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.goals_for}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.goals_against}</td>
                        <td className="px-4 py-3 text-center text-siyah/80">{r.goal_diff >= 0 ? `+${r.goal_diff}` : r.goal_diff}</td>
                        <td className="px-4 py-3 text-center font-bold text-bordo">{r.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-2 text-xs text-siyah/50">Kaynak: Mackolik.com — günde bir kez güncellenir.</p>
          </section>
        )}

        {/* Tüm maçlar: fikstür ve sonuçlar tablosu */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-1">Fikstür ve sonuçlar</h2>
          <p className="text-xs text-siyah/50 mb-4">Sezon içi tüm karşılaşmalar ve skorlar.</p>
          <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-siyah/10 bg-siyah/5">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70">Tarih</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70">Müsabaka</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70">Maç</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70 text-center">Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-siyah/60">Henüz maç eklenmedi.</td></tr>
                  ) : (
                    [...scheduled, ...finished].map((m) => (
                      <tr key={m.id} className="border-b border-siyah/5 hover:bg-siyah/[0.02]">
                        <td className="px-4 py-4 text-sm text-siyah/80">{new Date(m.match_date).toLocaleDateString("tr-TR")}</td>
                        <td className="px-4 py-4 text-sm text-siyah/80">{m.competition || "—"}</td>
                        <td className="px-4 py-4">
                          <Link href={`/maclar/${m.id}`} className="font-medium text-siyah hover:text-bordo">
                            {m.home_away === "home" ? "Güngören FK" : m.opponent_name} - {m.home_away === "away" ? "Güngören FK" : m.opponent_name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {m.status === "finished" && m.goals_for != null && m.goals_against != null ? (
                            <span className="font-bold text-bordo">{m.goals_for} - {m.goals_against}</span>
                          ) : (
                            <span className="text-siyah/50">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
