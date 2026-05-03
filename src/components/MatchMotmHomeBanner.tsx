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
      <section className="border-b border-siyah/10 bg-siyah/[0.03] py-6">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-siyah/50">Maçın oyuncusu yükleniyor…</div>
      </section>
    );
  }

  if (!data || !data.match) {
    return (
      <section className="border-b border-siyah/10 bg-gradient-to-r from-siyah/[0.04] via-bordo/[0.06] to-siyah/[0.04] py-5">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-center gap-1 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-siyah/45">Maçın oyuncusu</p>
          <p className="text-sm text-siyah/55">Şu an açık taraftar oylaması yok.</p>
        </div>
      </section>
    );
  }

  const { match, votingOpen, candidates, memberEligible, votedSquadId } = data;
  const label =
    match.homeAway === "home"
      ? `Güngören FK — ${match.opponentName}`
      : `${match.opponentName} — Güngören FK`;
  const ends = new Date(match.voteEndsAt).toLocaleString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const active = votingOpen && candidates.length > 0;

  return (
    <section
      className={`relative overflow-hidden border-b transition-all duration-500 ${
        active
          ? "border-amber-400/50 bg-gradient-to-br from-amber-100 via-beyaz to-bordo/10 py-10 shadow-[inset_0_0_60px_rgba(251,191,36,0.15)]"
          : "border-siyah/10 bg-siyah/[0.03] py-6"
      }`}
    >
      {active && (
        <div
          className="pointer-events-none absolute inset-0 opacity-30 animate-pulse"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 20%, rgba(180,30,60,0.25), transparent 40%), radial-gradient(circle at 80% 30%, rgba(251,191,36,0.35), transparent 45%)",
          }}
        />
      )}
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className={`font-display text-xs font-bold uppercase tracking-[0.35em] ${
                active ? "text-bordo" : "text-siyah/50"
              }`}
            >
              Maçın oyuncusu
            </p>
            <h2 className={`mt-2 font-display font-bold text-siyah ${active ? "text-2xl sm:text-3xl" : "text-xl"}`}>
              {label}
            </h2>
            <p className="mt-1 text-sm text-siyah/65">
              {new Date(match.matchDate).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" })}
              {match.matchTime ? ` · ${match.matchTime}` : ""}
              {match.season ? ` · ${match.season}` : ""}
            </p>
          </div>
          {active && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-950">
              Oylama bitiş: {ends}
            </div>
          )}
        </div>

        {!active && (
          <p className="mt-4 text-sm text-siyah/60">
            Bu maç için taraftar oylaması henüz başlamadı veya sona erdi. Aday listesi admin tarafından tanımlandığında burada görünür.
          </p>
        )}

        {active && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {candidates.map((c) => {
              const votedHere = votedSquadId === c.squadMemberId;
              return (
                <div
                  key={c.squadMemberId}
                  className={`flex flex-col rounded-2xl border-2 bg-beyaz/90 p-4 shadow-md backdrop-blur-sm transition-transform hover:-translate-y-0.5 ${
                    votedHere ? "border-bordo ring-2 ring-bordo/30" : "border-siyah/10 hover:border-amber-400/60"
                  }`}
                >
                  <div className="relative mx-auto aspect-square w-24 overflow-hidden rounded-full border-2 border-siyah/10 bg-siyah/5">
                    {c.photoUrl ? (
                      <Image src={c.photoUrl} alt="" fill className="object-cover" unoptimized sizes="96px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-bold text-siyah/30">
                        {c.shirtNumber ?? "?"}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-center font-bold text-siyah">
                    {c.shirtNumber != null ? `${c.shirtNumber}. ` : ""}
                    {c.name}
                  </p>
                  {c.position && <p className="text-center text-xs text-siyah/55">{c.position}</p>}
                  <p className="mt-2 text-center text-sm font-semibold text-bordo">{c.votes} oy</p>
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
                    className="mt-3 w-full rounded-xl bg-bordo py-2.5 text-sm font-bold text-beyaz shadow transition hover:bg-bordo-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {votedSquadId ? (votedHere ? "Oyunuz kayıtlı" : "Oy kullandınız") : loadingVote === c.squadMemberId ? "Gönderiliyor…" : "Oy ver"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {active && !memberEligible && (
          <p className="mt-6 text-center text-sm text-siyah/70">
            Oylamayı görebilirsiniz; oy kullanmak için{" "}
            <Link href="/taraftar/kayit" className="font-semibold text-bordo underline">
              taraftar üyeliği
            </Link>{" "}
            gerekir.
          </p>
        )}

      </div>
    </section>
  );
}
