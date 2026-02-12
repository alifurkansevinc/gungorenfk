"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { Match } from "@/types/db";
import type { LeagueStandingRow } from "@/types/db";
import { DEMO_IMAGES } from "@/lib/demo-images";

function findPositionInStandings(rows: LeagueStandingRow[], teamName: string): number | null {
  const normalized = teamName.toLowerCase().replace(/\s+/g, " ");
  for (const r of rows) {
    const n = r.team_name.toLowerCase().replace(/\s+/g, " ");
    if (n.includes(normalized) || normalized.includes(n)) return r.position;
  }
  return null;
}

const OUR_TEAM_NAMES = ["güngören", "gungoren", "güngören bld", "gungoren bld"];

function getOurPosition(rows: LeagueStandingRow[]): number | null {
  for (const r of rows) {
    const n = r.team_name.toLowerCase();
    if (OUR_TEAM_NAMES.some((t) => n.includes(t))) return r.position;
  }
  return null;
}

type NextMatchGalleryProps = {
  scheduledMatches: Match[];
  standingsRows: LeagueStandingRow[];
};

export function NextMatchGallery({ scheduledMatches, standingsRows }: NextMatchGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (scheduledMatches.length === 0) {
    return (
      <section className="mb-14">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-4">Sonraki maç</h2>
        <p className="rounded-xl border border-siyah/10 bg-siyah/5 px-4 py-6 text-center text-sm text-siyah/60">
          Şu an planlanmış maç bulunmuyor.
        </p>
      </section>
    );
  }

  const active = scheduledMatches[activeIndex]!;
  const ourPosition = getOurPosition(standingsRows);
  const opponentPosition = findPositionInStandings(standingsRows, active.opponent_name);
  const matchLabel =
    active.home_away === "home"
      ? `Güngören FK - ${active.opponent_name}`
      : `${active.opponent_name} - Güngören FK`;

  return (
    <section className="mb-14">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-4">
        Sonraki maç{scheduledMatches.length > 1 ? "lar" : ""}
      </h2>

      {/* Yan yana kartlar - yönetim kurulu tarzı */}
      <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
        {scheduledMatches.map((m, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`
                relative flex-shrink-0 snap-center overflow-hidden rounded-xl border-2 transition-all duration-300
                ${isActive ? "w-[200px] sm:w-[260px] border-bordo shadow-lg shadow-bordo/20" : "w-[72px] sm:w-[88px] border-siyah/15 hover:border-siyah/30"}
              `}
            >
              <div className="aspect-[4/3] sm:aspect-video relative bg-siyah">
                <Image
                  src={DEMO_IMAGES.match}
                  alt=""
                  fill
                  className={`object-cover transition-all duration-300 ${isActive ? "grayscale-0 scale-105" : "grayscale opacity-80"}`}
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-siyah/90 via-siyah/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                  <p className="text-[10px] sm:text-xs font-semibold text-bordo truncate">
                    {m.competition || "Lig"}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-beyaz truncate mt-0.5">
                    {m.opponent_name}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Kartların altında maç bilgileri */}
      <div className="mt-4 rounded-xl border border-siyah/10 bg-beyaz p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-bordo">
              Takım karşılaşması
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-siyah sm:text-xl">
              {matchLabel}
            </p>
          </div>
          <Link
            href={`/maclar/${active.id}`}
            className="rounded-full bg-bordo px-4 py-2 text-sm font-bold text-beyaz hover:bg-bordo/90 transition-colors"
          >
            Maç detayı →
          </Link>
        </div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wider text-siyah/50">Tarih</dt>
            <dd className="mt-0.5 text-sm font-medium text-siyah">
              {new Date(active.match_date).toLocaleDateString("tr-TR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </dd>
          </div>
          {active.venue && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-siyah/50">Stadyum</dt>
              <dd className="mt-0.5 text-sm font-medium text-siyah">{active.venue}</dd>
            </div>
          )}
          {active.competition && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-siyah/50">Müsabaka</dt>
              <dd className="mt-0.5 text-sm font-medium text-siyah">{active.competition}</dd>
            </div>
          )}
          {(ourPosition != null || opponentPosition != null) && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-siyah/50">
                Lig sıralaması
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-siyah">
                {[
                  ourPosition != null && `Güngören FK ${ourPosition}.`,
                  opponentPosition != null && `Rakip ${opponentPosition}.`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
