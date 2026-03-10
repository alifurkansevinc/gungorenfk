import Link from "next/link";
import Image from "next/image";
import { Trophy, Minus, XCircle } from "lucide-react";
import { getMatches, getLeagueStandings, getNextMatch } from "@/lib/data";
import { getMackolikMatches } from "@/lib/mackolik";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { NextMatchCard } from "@/components/NextMatchCard";

type ResultType = "W" | "D" | "L";

function ResultBadge({ result }: { result: ResultType }) {
  if (result === "W")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700" title="Galibiyet">
        <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  if (result === "D")
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-siyah/15 text-siyah/70" title="Beraberlik">
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
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
    getMackolikMatches(),
  ]);
  const finished = matches.filter((m) => m.status === "finished");
  const scheduled = matches.filter((m) => m.status === "scheduled");
  const hasRealMatches = matches.length > 0 && !matches[0].id.startsWith("demo-");
  const useMackolik = mackolikMatches.length > 0 && !hasRealMatches;
  const leagueName = standings.rows.length > 0 ? standings.league_name : "İstanbul 1. Amatör Lig";

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
                    {standings.rows.map((r) => (
                      <tr
                        key={r.position}
                        className={`border-b border-siyah/5 ${r.team_name.toLowerCase().includes("güngören") || r.team_name.toLowerCase().includes("gungoren") ? "bg-bordo/5 font-semibold" : "hover:bg-siyah/[0.02]"}`}
                      >
                        <td className="px-1 py-1.5 sm:px-2 sm:py-2 text-siyah/80">{r.position}</td>
                        <td className="min-w-0 px-1 py-1.5 sm:px-2 sm:py-2 font-medium text-siyah truncate" title={r.team_name}>{r.team_name}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.played}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.wins}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.draws}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.losses}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.goals_for}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.goals_against}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center text-siyah/80">{r.goal_diff >= 0 ? `+${r.goal_diff}` : r.goal_diff}</td>
                        <td className="px-0.5 py-1.5 sm:py-2 text-center font-bold text-bordo">{r.points}</td>
                      </tr>
                    ))}
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
          <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz">
            <div className="overflow-x-auto overflow-y-visible">
              <table className="w-full text-left text-[11px] sm:text-sm table-fixed">
                <thead>
                  <tr className="border-b border-siyah/10 bg-siyah/5">
                    <th className="w-14 sm:w-20 px-1 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-siyah/70">Tarih</th>
                    <th className="w-16 sm:w-24 px-1 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-siyah/70">Müsabaka</th>
                    <th className="min-w-0 px-1 py-1.5 sm:px-2 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-siyah/70">Maç</th>
                    <th className="w-12 sm:w-14 px-0.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-siyah/70 text-center">Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {useMackolik ? (
                    mackolikMatches.map((m, i) => {
                      const hasScore = m.goalsHome != null && m.goalsAway != null;
                      const isGungorenHome = /güngören|gungoren|güngören bld/i.test(m.home);
                      const ourGoals = hasScore ? (isGungorenHome ? m.goalsHome! : m.goalsAway!) : 0;
                      const theirGoals = hasScore ? (isGungorenHome ? m.goalsAway! : m.goalsHome!) : 0;
                      const result: ResultType = !hasScore ? "D" : ourGoals > theirGoals ? "W" : ourGoals < theirGoals ? "L" : "D";
                      const müsabakaLabel = (m.competition && m.competition.trim()) ? m.competition : leagueName;
                      return (
                        <tr key={`mackolik-${i}-${m.date}-${m.home}`} className="border-b border-siyah/5 hover:bg-siyah/[0.02]">
                          <td className="px-1 py-2 sm:py-2.5 text-siyah/80 whitespace-nowrap">{new Date(m.date + "T12:00:00").toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                          <td className="px-1 py-2 sm:py-2.5 text-siyah/80 text-[10px] sm:text-xs truncate" title={müsabakaLabel}>{müsabakaLabel}</td>
                          <td className="min-w-0 px-1 py-2 sm:py-2.5 font-medium text-siyah text-[11px] sm:text-sm truncate">{m.home} – {m.away}</td>
                          <td className="px-2 py-2 sm:py-2.5">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {hasScore ? (
                                <>
                                  <span className="font-bold text-siyah tabular-nums">{m.goalsHome} – {m.goalsAway}</span>
                                  <ResultBadge result={result} />
                                </>
                              ) : (
                                <span className="text-siyah/50">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : matches.length === 0 ? (
                    <tr><td colSpan={4} className="px-2 py-6 text-center text-siyah/60 text-xs">Henüz maç eklenmedi.</td></tr>
                  ) : (
                    [...scheduled, ...finished].map((m) => {
                      const isFinished = m.status === "finished" && m.goals_for != null && m.goals_against != null;
                      const result: ResultType = !isFinished ? "D" : m.goals_for! > m.goals_against! ? "W" : m.goals_for! < m.goals_against! ? "L" : "D";
                      const müsabakaLabel = (m.competition && m.competition.trim()) ? m.competition : leagueName;
                      return (
                        <tr key={m.id} className="border-b border-siyah/5 hover:bg-siyah/[0.02]">
                          <td className="px-1 py-2 sm:py-2.5 text-siyah/80 whitespace-nowrap">{new Date(m.match_date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "2-digit" })}</td>
                          <td className="px-1 py-2 sm:py-2.5 text-siyah/80 text-[10px] sm:text-xs truncate" title={müsabakaLabel}>{müsabakaLabel}</td>
                          <td className="min-w-0 px-1 py-2 sm:py-2.5">
                            <Link href={`/maclar/${m.id}`} className="font-medium text-siyah hover:text-bordo text-[11px] sm:text-sm truncate block">
                              {m.home_away === "home" ? "Güngören FK" : m.opponent_name} – {m.home_away === "away" ? "Güngören FK" : m.opponent_name}
                            </Link>
                          </td>
                          <td className="px-2 py-2 sm:py-2.5">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              {isFinished ? (
                                <>
                                  <span className="font-bold text-siyah tabular-nums">
                                    {m.home_away === "home" ? `${m.goals_for} – ${m.goals_against}` : `${m.goals_against} – ${m.goals_for}`}
                                  </span>
                                  <ResultBadge result={result} />
                                </>
                              ) : (
                                <span className="text-siyah/50">—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
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
