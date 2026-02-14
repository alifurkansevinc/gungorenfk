"use client";

import { useState } from "react";
import Image from "next/image";
import { BiletAlButton } from "./BiletAlButton";
import { Ticket, ChevronDown, ChevronUp, Calendar, MapPin, Clock } from "lucide-react";

type Match = {
  id: string;
  opponent_name: string;
  home_away: string;
  venue: string | null;
  match_date: string;
  match_time: string | null;
  competition: string | null;
  opponent_logo_url: string | null;
};

export function MacKartlari({ matches }: { matches: Match[] }) {
  const [seciliMacId, setSeciliMacId] = useState<string | null>(null);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="space-y-5">
      {matches.map((m) => {
        const secili = seciliMacId === m.id;
        const isHome = m.home_away === "home";
        const macLabel = isHome
          ? `Güngören FK - ${m.opponent_name}`
          : `${m.opponent_name} - Güngören FK`;
        const tarihStr = new Date(m.match_date + "T12:00:00").toLocaleDateString("tr-TR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const saatStr = m.match_time?.trim() || "";

        return (
          <div
            key={m.id}
            className={`overflow-hidden rounded-2xl border-2 bg-beyaz shadow-lg transition-all duration-300 ${
              secili ? "border-bordo ring-2 ring-bordo/20" : "border-siyah/10 hover:border-siyah/20"
            }`}
          >
            <button
              type="button"
              onClick={() => setSeciliMacId(secili ? null : m.id)}
              className="w-full text-left"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6">
                {/* Logolar */}
                <div className="flex items-center justify-center gap-4 sm:gap-6 shrink-0">
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-siyah/10 bg-bordo shadow-md sm:h-20 sm:w-20">
                    <Image src="/logogbfk.png" alt="Güngören FK" fill className="object-contain p-2" unoptimized />
                  </div>
                  <span className="text-lg font-bold text-siyah/40">VS</span>
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden border-2 border-siyah/10 bg-siyah/5 shadow-md sm:h-20 sm:w-20">
                    {m.opponent_logo_url ? (
                      <Image src={m.opponent_logo_url} alt={m.opponent_name} fill className="object-contain p-2" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-siyah/50">
                        {m.opponent_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-bold text-siyah sm:text-xl">{macLabel}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-siyah/70">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 shrink-0" />
                      {tarihStr}
                    </span>
                    {saatStr && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4 shrink-0" />
                        {saatStr}
                      </span>
                    )}
                    {m.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {m.venue}
                      </span>
                    )}
                  </div>
                  {m.competition && (
                    <p className="mt-1 text-xs text-siyah/50">{m.competition}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 text-bordo shrink-0">
                  {secili ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                  <span className="text-sm font-semibold">
                    {secili ? "Bilet bölümü açık" : "Bilet al"}
                  </span>
                </div>
              </div>
            </button>

            {secili && (
              <div className="border-t-2 border-dashed border-bordo/20 bg-gradient-to-b from-bordo/5 to-transparent px-6 pb-6 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 text-siyah/80">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bordo/10">
                      <Ticket className="h-6 w-6 text-bordo" />
                    </div>
                    <div>
                      <p className="font-semibold text-siyah">Ücretsiz bilet</p>
                      <p className="text-sm">Bu maç için tek tıkla biletinizi alın.</p>
                    </div>
                  </div>
                  <BiletAlButton matchId={m.id} matchName={m.opponent_name} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
