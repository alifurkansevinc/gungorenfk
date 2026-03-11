import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Circle, XCircle } from "lucide-react";
import { getMatches, getLeagueStandings, getNextMatch, getMackolikFixtureUrl } from "@/lib/data";
import { getMackolikMatches } from "@/lib/mackolik";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { NextMatchCard } from "@/components/NextMatchCard";

type ResultType = "W" | "D" | "L";

function ResultBadge({ result }: { result: ResultType }) {
  if (result === "W")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600" title="Galibiyet">
        <CheckCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  if (result === "D")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-siyah/15 text-siyah/60" title="Beraberlik">
        <Circle className="h-3.5 w-3.5" strokeWidth={2.5} fill="currentColor" />
      </span>
    );
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-600" title="Mağlubiyet">
      <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

export const metadata = {
  title: "Sıralama & Maçlar | Güngören FK",
  description: "Güngören FK maç programı, puan durumu ve sonuçları.",
};

export default async function MaclarPage() {
  const [matches, standings, nextMatch, mackolikMatches] = await Promise.all([
    getMatches(24),
    getLeagueStandings(),
    getNextMatch(),
    getMackolikFixtureUrl().then((url) => getMackolikMatches(url)),
  ]);
  const hasRealMatches = matches.length > 0 && !matches[0].id.startsWith("demo-");
  const useMackolik = mackolikMatches.length > 0 && !hasRealMatches;
  const leagueName = standings.rows.length > 0 ? standings.league_name : "İstanbul 1. Amatör Lig";
  const todayStr = new Date().toISOString().slice(0, 10);
  // En üstte en yeni, en altta en eski (tarihe göre azalan)
  const sortedDbMatches = [...matches].sort((a, b) => b.match_date.localeCompare(a.match_date));

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

        {/* Puan durumu (Mackolik kaynaklı) - mobilde tam görünür, slider yok */}
        {standings.rows.length > 0 && (
          <section className="mb-14">
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-2 sm:mb-4">Puan durumu</h2>
            <p className="text-xs sm:text-sm text-siyah/70 mb-2 sm:mb-3">
              {standings.league_name} — {standings.season}
              {standings.updated_at && (
                <span className="ml-1 sm:ml-2">(Son güncelleme: {new Date(standings.updated_at).toLocaleDateString("tr-TR")})</span>
              )}
            </p>
            <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz">
              <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left text-[11px] sm:text-sm table-fixed">
                  <thead>
                    <tr className="border-b border-siyah/10 bg-siyah/5">
                      <th className="w-6 sm:w-8 px-1 py-1.5 sm:px-2 sm:py-2 font-semibold text-siyah/70">#</th>
                      <th className="min-w-0 px-1 py-1.5 sm:px-2 sm:py-2 font-semibold text-siyah/70 truncate">Takım</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">O</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">G</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">B</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">M</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">A</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">Y</th>
                      <th className="w-7 sm:w-9 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">Av</th>
                      <th className="w-6 sm:w-8 px-0.5 py-1.5 sm:py-2 font-semibold text-siyah/70 text-center">P</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.rows.map((r) => {
                      const isGungoren = r.team_name.toLowerCase().includes("güngören") || r.team_name.toLowerCase().includes("gungoren");
                      const rowBg = isGungoren ? "bg-bordo/20" : "";
                      return (
                      <tr
                        key={r.position}
                        className={`border-b border-siyah/5 ${isGungoren ? "font-semibold" : "hover:bg-siyah/[0.02]"}`}
                      >
                        <td className={`px-1 py-1.5 sm:px-2 sm:py-2 text-siyah/80 ${rowBg} ${isGungoren ? "rounded-l-lg" : ""}`}>{r.position}</td>
                        <td className={`min-w-0 px-1 py-1.5 sm:px-2 sm:py-2 font-medium text-siyah truncate ${rowBg}`} title={r.team_name}>{r.team_name}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.played}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.wins}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.draws}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.losses}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.goals_for}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.goals_against}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center text-siyah/80 ${rowBg}`}>{r.goal_diff >= 0 ? `+${r.goal_diff}` : r.goal_diff}</td>
                        <td className={`px-0.5 py-1.5 sm:py-2 text-center font-bold text-bordo ${rowBg} ${isGungoren ? "rounded-r-lg" : ""}`}>{r.points}</td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-2 text-[10px] sm:text-xs text-siyah/50">Kaynak: Mackolik.com — günde bir kez güncellenir.</p>
          </section>
        )}

        {/* Fikstür ve sonuçlar — Mackolik’ten veya veritabanından */}
        <section>
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-1">Fikstür ve sonuçlar</h2>
          <p className="text-[10px] sm:text-xs text-siyah/50 mb-2 sm:mb-4">
            {useMackolik ? "Kaynak: Mackolik.com — Güngören Belediye Spor Kulübü fikstürü." : "Sezon içi tüm karşılaşmalar ve skorlar."}
          </p>
          <div className="space-y-0 overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm">
            {useMackolik ? (
              mackolikMatches.length === 0 ? (
                <div className="py-10 text-center text-sm text-siyah/50">Henüz maç yok.</div>
              ) : (
                mackolikMatches.map((m, i) => {
                  const hasScore = m.goalsHome != null && m.goalsAway != null;
                  const isFinished = m.status === "finished";
                  const isGungorenHome = /güngören|gungoren|güngören bld/i.test(m.home);
                  const ourGoals = hasScore ? (isGungorenHome ? m.goalsHome! : m.goalsAway!) : 0;
                  const theirGoals = hasScore ? (isGungorenHome ? m.goalsAway! : m.goalsHome!) : 0;
                  const result: ResultType = !hasScore ? "D" : ourGoals > theirGoals ? "W" : ourGoals < theirGoals ? "L" : "D";
                  const müsabakaLabel = (m.competition && m.competition.trim()) ? m.competition : leagueName;
                  const dateStr = new Date(m.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" });
                  return (
                    <div
                      key={`mackolik-${i}-${m.date}-${m.home}`}
                      className={`flex flex-col items-center justify-center px-4 py-5 text-center transition-colors hover:bg-siyah/[0.03] ${i > 0 ? "border-t border-siyah/5" : ""} ${isFinished ? "bg-siyah/[0.02]" : ""}`}
                    >
                      <p className="mb-2 text-xs font-medium text-siyah/60">
                        {dateStr} <span className="mx-1.5 text-siyah/40">·</span> {müsabakaLabel}
                      </p>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 w-full max-w-xl mx-auto">
                        <span className={`min-w-0 max-w-[140px] truncate text-right text-sm sm:max-w-[180px] ${/güngören|gungoren|güngören bld/i.test(m.home) ? "font-extrabold text-siyah" : "font-medium text-siyah"}`} title={m.home}>{m.home}</span>
                        <div className="flex items-center justify-center gap-2 w-20 shrink-0 tabular-nums">
                          <span className="font-bold text-siyah w-6 text-center">{hasScore ? m.goalsHome : "–"}</span>
                          <ResultBadge result={result} />
                          <span className="font-bold text-siyah w-6 text-center">{hasScore ? m.goalsAway : "–"}</span>
                        </div>
                        <span className={`min-w-0 max-w-[140px] truncate text-left text-sm sm:max-w-[180px] ${/güngören|gungoren|güngören bld/i.test(m.away) ? "font-extrabold text-siyah" : "font-medium text-siyah"}`} title={m.away}>{m.away}</span>
                      </div>
                      <span className={`mt-2 text-[11px] font-medium ${isFinished ? "text-emerald-600" : "text-bordo/90"}`}>
                        {isFinished ? "Bitti" : "Planlanan"}
                      </span>
                    </div>
                  );
                })
              )
            ) : matches.length === 0 ? (
              <div className="py-10 text-center text-sm text-siyah/50">Henüz maç eklenmedi.</div>
            ) : (
              sortedDbMatches.map((m, i) => {
                const hasScoreDb = m.goals_for != null && m.goals_against != null;
                const result: ResultType = !hasScoreDb ? "D" : m.goals_for! > m.goals_against! ? "W" : m.goals_for! < m.goals_against! ? "L" : "D";
                const müsabakaLabel = (m.competition && m.competition.trim()) ? m.competition : leagueName;
                const isFinishedDb = m.status === "finished";
                const teamHome = m.home_away === "home" ? "Güngören FK" : m.opponent_name;
                const teamAway = m.home_away === "away" ? "Güngören FK" : m.opponent_name;
                const scoreHome = m.home_away === "home" ? m.goals_for : m.goals_against;
                const scoreAway = m.home_away === "away" ? m.goals_for : m.goals_against;
                const dateStr = new Date(m.match_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" });
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col items-center justify-center px-4 py-5 text-center transition-colors hover:bg-siyah/[0.03] ${i > 0 ? "border-t border-siyah/5" : ""} ${isFinishedDb ? "bg-siyah/[0.02]" : ""}`}
                  >
                    <p className="mb-2 text-xs font-medium text-siyah/60">
                      {dateStr} <span className="mx-1.5 text-siyah/40">·</span> {müsabakaLabel}
                    </p>
                    <Link href={`/maclar/${m.id}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 gap-y-2 w-full max-w-xl mx-auto hover:opacity-90">
                      <span className={`min-w-0 max-w-[140px] truncate text-right text-sm sm:max-w-[180px] ${teamHome === "Güngören FK" ? "font-extrabold text-siyah" : "font-medium text-siyah"}`}>{teamHome}</span>
                      <div className="flex items-center justify-center gap-2 w-20 shrink-0 tabular-nums">
                        <span className="font-bold text-siyah w-6 text-center">{hasScoreDb ? scoreHome : "–"}</span>
                        <ResultBadge result={result} />
                        <span className="font-bold text-siyah w-6 text-center">{hasScoreDb ? scoreAway : "–"}</span>
                      </div>
                      <span className={`min-w-0 max-w-[140px] truncate text-left text-sm sm:max-w-[180px] ${teamAway === "Güngören FK" ? "font-extrabold text-siyah" : "font-medium text-siyah"}`}>{teamAway}</span>
                    </Link>
                    <span className={`mt-2 text-[11px] font-medium ${isFinishedDb ? "text-emerald-600" : "text-bordo/90"}`}>
                      {isFinishedDb ? "Bitti" : "Planlanan"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
