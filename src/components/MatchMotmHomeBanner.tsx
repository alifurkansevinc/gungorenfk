"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { MatchMotmPublicCandidate } from "@/lib/match-motm";

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
  votingOpen: boolean;
  candidates: MatchMotmPublicCandidate[];
  memberEligible: boolean;
  votedSquadId: string | null;
};

const GUEST_ALERT =
  "Oylamaya katılmak için lütfen önce taraftar olarak üye olun (kayıt veya giriş).";

const MAX_CANDIDATES = 5;

function formatVoteWindow(startsIso: string, endsIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  };
  const a = new Date(startsIso).toLocaleString("tr-TR", opts);
  const b = new Date(endsIso).toLocaleString("tr-TR", opts);
  return `Başlangıç: ${a} · Son oy: ${b}`;
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
    return (
      <section className="border-b border-white/10 bg-zinc-950 py-4">
        <div className="mx-auto max-w-5xl px-4 flex flex-col gap-1 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Maçın oyuncusu</p>
          <p className="text-xs text-zinc-400">Şu an açık taraftar oylaması yok.</p>
        </div>
      </section>
    );
  }

  const { match, votingOpen, candidates, memberEligible, votedSquadId } = data;
  const label =
    match.homeAway === "home"
      ? `Güngören FK — ${match.opponentName}`
      : `${match.opponentName} — Güngören FK`;
  const voteLine = formatVoteWindow(match.voteStartsAt, match.voteEndsAt);
  const row = candidates.slice(0, MAX_CANDIDATES);
  const active = votingOpen && row.length > 0;

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
          </div>
          {active && (
            <div className="shrink-0 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Oylama süresi</p>
              <p className="mt-1 max-w-[min(100vw-2rem,20rem)] text-xs leading-snug text-zinc-200">{voteLine}</p>
            </div>
          )}
        </div>

        {!active && (
          <p className="mt-4 text-xs leading-relaxed text-zinc-500">
            Bu maç için taraftar oylaması henüz başlamadı veya sona erdi. Adaylar admin tarafından tanımlandığında burada görünür.
          </p>
        )}

        {active && (
          <div className="mt-5 grid grid-cols-5 gap-2 sm:gap-3">
            {row.map((c) => {
              const votedHere = votedSquadId === c.squadMemberId;
              return (
                <div
                  key={c.squadMemberId}
                  className={`flex min-w-0 flex-col rounded-lg border p-1.5 sm:p-2 ${
                    votedHere ? "border-bordo bg-bordo/15 ring-1 ring-bordo/50" : "border-white/10 bg-black/30"
                  }`}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-md bg-zinc-900">
                    {c.photoUrl ? (
                      <Image src={c.photoUrl} alt="" fill className="object-cover object-top" unoptimized sizes="(max-width:768px) 18vw, 120px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg font-bold text-zinc-600">
                        {c.shirtNumber ?? "?"}
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 truncate text-center text-[10px] font-bold leading-tight text-white sm:text-xs" title={c.name}>
                    {c.shirtNumber != null ? `${c.shirtNumber}. ` : ""}
                    {c.name}
                  </p>
                  {c.position && (
                    <p className="truncate text-center text-[9px] text-zinc-500 sm:text-[10px]" title={c.position}>
                      {c.position}
                    </p>
                  )}
                  <p className="mt-0.5 text-center text-[10px] font-semibold text-bordo/90">{c.votes} oy</p>
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
                    className="mt-1.5 w-full rounded-md bg-bordo py-1.5 text-[10px] font-bold text-white transition hover:bg-bordo-dark disabled:cursor-not-allowed disabled:opacity-45 sm:text-xs"
                  >
                    {votedSquadId ? (votedHere ? "Kayıtlı" : "Oy verildi") : loadingVote === c.squadMemberId ? "…" : "Oy ver"}
                  </button>
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
