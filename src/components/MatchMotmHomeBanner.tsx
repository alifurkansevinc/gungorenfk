"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MatchMotmPublicCandidate } from "@/lib/match-motm";
import { MAX_MOTM_CANDIDATES } from "@/lib/match-motm";

type MotmPhase = "open" | "upcoming" | "ended";

type ApiData = {
  match: {
    id: string;
    opponentName: string;
    matchDate: string;
    matchTime: string | null;
    homeAway: string;
    season: string | null;
    voteStartsAt: string;
    voteEndsAt: string;
  };
  phase?: MotmPhase;
  votingOpen: boolean;
  candidates: MatchMotmPublicCandidate[];
  memberEligible: boolean;
  votedSquadId: string | null;
};

const GUEST_ALERT =
  "Oylamaya katılmak için lütfen önce taraftar olarak üye olun (kayıt veya giriş).";

const dateTimeOpts: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", dateTimeOpts);
}

function formatMatchDate(dateStr: string, timeStr: string | null): string {
  const d = new Date(`${dateStr}T${timeStr || "00:00"}:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "short",
    ...(timeStr ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function matchLabel(match: ApiData["match"]): string {
  return match.homeAway === "home"
    ? `Güngören FK — ${match.opponentName}`
    : `${match.opponentName} — Güngören FK`;
}

function IdleState() {
  return (
    <section className="border-b border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Maçın oyuncusu</p>
        <h2 className="mt-1.5 font-display text-lg font-bold text-white sm:text-xl">Taraftar oylaması</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
          Maç bittikten sonra adaylar arasından <span className="font-semibold text-white">Maçın Oyuncusu</span>nu sen
          seçersin. Oy kullanmak için taraftar üyeliği gerekir; her üyeye tek oy.
        </p>
        <p className="mt-3 text-sm font-medium text-bordo/90">Şu an açık veya planlanmış oylama yok.</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Bir sonraki oylama açıldığında adaylar burada görünür. Kazananlar ayrıca{" "}
          <span className="text-zinc-400">Haftanın oyuncuları</span> duvarında duyurulur.
        </p>
        <p className="mt-4 text-[11px] text-zinc-500">
          Üye değil misin?{" "}
          <Link href="/taraftar/kayit" className="font-semibold text-bordo underline-offset-2 hover:underline">
            Taraftar ol
          </Link>
        </p>
      </div>
    </section>
  );
}

export function MatchMotmHomeBanner() {
  const [data, setData] = useState<ApiData | null | undefined>(undefined);
  const [loadingVote, setLoadingVote] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/public/match-motm", { cache: "no-store" });
      const j = await r.json();
      if (j.success && j.data) setData(j.data as ApiData);
      else setData(null);
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 25000);
    return () => clearInterval(t);
  }, [load]);

  if (data === undefined) {
    return (
      <section className="border-b border-white/10 bg-zinc-950 py-4">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-zinc-500">Maçın oyuncusu yükleniyor…</div>
      </section>
    );
  }

  if (!data || !data.match) {
    return <IdleState />;
  }

  const { match, votingOpen, candidates, memberEligible, votedSquadId } = data;
  const phase: MotmPhase =
    data.phase ?? (votingOpen ? "open" : new Date() < new Date(match.voteStartsAt) ? "upcoming" : "ended");
  const label = matchLabel(match);
  const row = candidates.slice(0, MAX_MOTM_CANDIDATES);
  const active = phase === "open" && row.length > 0;
  const canShowCandidates = (phase === "open" || phase === "upcoming") && row.length > 0;

  return (
    <section
      className={`border-b transition-colors ${active ? "border-bordo/40 bg-zinc-950" : "border-white/10 bg-zinc-950"}`}
    >
      <div className="mx-auto max-w-5xl px-4 py-5 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-[0.28em] ${active ? "text-bordo" : "text-zinc-500"}`}>
              Maçın oyuncusu
              {match.season ? (
                <span className="ml-2 font-semibold normal-case tracking-normal text-zinc-400">· {match.season}</span>
              ) : null}
            </p>
            <h2 className="mt-1.5 truncate font-display text-lg font-bold leading-tight text-white sm:text-xl">{label}</h2>
            <p className="mt-1 text-xs text-zinc-400">{formatMatchDate(match.matchDate, match.matchTime)}</p>
          </div>

          {phase === "open" && (
            <div className="shrink-0 rounded-lg border border-bordo/30 bg-bordo/10 px-3 py-2 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-bordo">Oylama açık</p>
              <p className="mt-1 max-w-[min(100vw-2rem,20rem)] text-xs leading-snug text-zinc-200">
                Son oy: {formatDateTime(match.voteEndsAt)}
              </p>
            </div>
          )}
          {phase === "upcoming" && (
            <div className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Yakında</p>
              <p className="mt-1 max-w-[min(100vw-2rem,20rem)] text-xs leading-snug text-zinc-200">
                Başlangıç: {formatDateTime(match.voteStartsAt)}
              </p>
            </div>
          )}
          {phase === "ended" && (
            <div className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Oylama kapandı</p>
              <p className="mt-1 max-w-[min(100vw-2rem,20rem)] text-xs leading-snug text-zinc-400">
                {formatDateTime(match.voteEndsAt)} itibarıyla bitti
              </p>
            </div>
          )}
        </div>

        {phase === "upcoming" && (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300">
            Bu maç için taraftar oylaması henüz başlamadı.{" "}
            <span className="font-semibold text-white">{formatDateTime(match.voteStartsAt)}</span> itibarıyla adaylar
            arasından Maçın Oyuncusu’nu seçebilirsin.
            {row.length === 0 ? " Aday listesi oylama açılınca burada yer alır." : null}
          </p>
        )}

        {phase === "ended" && (
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-300">
            Bu maçın taraftar oylaması sona erdi. Sonuçlar yalnızca kulüp tarafından değerlendirilir; kazanan{" "}
            <span className="text-zinc-200">Haftanın oyuncuları</span> duvarında duyurulabilir.
          </p>
        )}

        {phase === "open" && row.length === 0 && (
          <p className="mt-4 text-sm text-zinc-400">Oylama açık ancak aday listesi henüz yayınlanmadı. Kısa süre sonra tekrar bak.</p>
        )}

        {canShowCandidates && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-3">
            {row.map((c) => {
              const votedHere = votedSquadId === c.squadMemberId;
              return (
                <div
                  key={c.squadMemberId}
                  className={`flex min-w-0 flex-col rounded-lg border p-2 sm:p-2 ${
                    votedHere && active
                      ? "border-bordo bg-bordo/15 ring-1 ring-bordo/50"
                      : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="relative mx-auto aspect-square w-full max-w-[7.5rem] overflow-hidden rounded-md bg-zinc-900 sm:max-w-none">
                    {c.photoUrl ? (
                      <Image
                        src={c.photoUrl}
                        alt=""
                        fill
                        className="object-cover object-top"
                        unoptimized
                        sizes="(max-width:768px) 40vw, 120px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-bold text-zinc-600">
                        {c.shirtNumber ?? "?"}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 truncate text-center text-xs font-bold leading-tight text-white sm:text-xs" title={c.name}>
                    {c.shirtNumber != null ? `${c.shirtNumber}. ` : ""}
                    {c.name}
                  </p>
                  {c.position && (
                    <p className="truncate text-center text-[10px] text-zinc-500" title={c.position}>
                      {c.position}
                    </p>
                  )}
                  {active ? (
                    <button
                      type="button"
                      disabled={!!votedSquadId || loadingVote !== null}
                      onClick={async () => {
                        if (!memberEligible) {
                          window.alert(GUEST_ALERT);
                          return;
                        }
                        if (votedSquadId) return;
                        if (!window.confirm(`${c.name} için oy kullanılsın mı? Oy bir kez verilir ve değiştirilemez.`)) return;
                        setLoadingVote(c.squadMemberId);
                        try {
                          const r = await fetch("/api/public/match-motm/vote", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ matchId: match.id, squadMemberId: c.squadMemberId }),
                          });
                          const j = await r.json();
                          if (!j.success) {
                            window.alert(j.error || "Oy kullanılamadı.");
                            return;
                          }
                          await load();
                        } finally {
                          setLoadingVote(null);
                        }
                      }}
                      className="mt-2 min-h-[44px] w-full rounded-md bg-bordo px-2 py-2.5 text-xs font-bold text-white transition hover:bg-bordo-dark disabled:cursor-not-allowed disabled:opacity-45 sm:text-sm"
                    >
                      {votedSquadId ? (votedHere ? "Kayıtlı" : "Oy verildi") : loadingVote === c.squadMemberId ? "…" : "Oy ver"}
                    </button>
                  ) : (
                    <p className="mt-2 text-center text-[10px] font-medium text-zinc-500">Aday</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {active && !memberEligible && (
          <p className="mt-4 text-center text-[11px] text-zinc-400">
            Oy kullanmak için{" "}
            <Link href="/taraftar/kayit" className="font-semibold text-bordo underline-offset-2 hover:underline">
              taraftar üyeliği
            </Link>{" "}
            gerekir.
          </p>
        )}
      </div>
    </section>
  );
}
