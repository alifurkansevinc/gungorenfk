"use client";

import { useState } from "react";
import Image from "next/image";
import { BiletAlButton } from "./BiletAlButton";
import { KoltukSecimi } from "./KoltukSecimi";
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
  const [seciliKoltukId, setSeciliKoltukId] = useState<string | null>(null);
  const [seciliKoltukKod, setSeciliKoltukKod] = useState<string | null>(null);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="space-y-6">
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
        const saatStr = m.match_time?.trim();
        const saatGoster = saatStr ? saatStr : "—";

        return (
          <div
            key={m.id}
            className={`overflow-hidden rounded-2xl border-2 bg-beyaz shadow-xl transition-all duration-300 ${
              secili
                ? "border-bordo ring-4 ring-bordo/20 shadow-bordo/10"
                : "border-siyah/10 hover:border-siyah/20 hover:shadow-2xl"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setSeciliMacId(secili ? null : m.id);
                if (!secili) {
                  setSeciliKoltukId(null);
                  setSeciliKoltukKod(null);
                }
              }}
              className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-bordo focus-visible:ring-offset-2 rounded-2xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 sm:p-7">
                {/* Logolar — daha büyük ve vurgulu */}
                <div className="flex items-center justify-center gap-5 sm:gap-8 shrink-0">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-siyah/10 bg-bordo shadow-lg sm:h-24 sm:w-24">
                    <Image src="/logogbfk.png" alt="Güngören FK" fill className="object-contain p-2.5" unoptimized />
                  </div>
                  <span className="text-xl font-black text-siyah/30 sm:text-2xl">VS</span>
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-siyah/10 bg-siyah/5 shadow-lg sm:h-24 sm:w-24">
                    {m.opponent_logo_url ? (
                      <Image src={m.opponent_logo_url} alt={m.opponent_name} fill className="object-contain p-2.5" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-siyah/40">
                        {m.opponent_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  {m.competition && (
                    <span className="inline-block rounded-full bg-siyah/10 px-2.5 py-0.5 text-xs font-semibold text-siyah/70 uppercase tracking-wide">
                      {m.competition}
                    </span>
                  )}
                  <p className="font-display mt-1.5 text-xl font-bold text-siyah sm:text-2xl">{macLabel}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-siyah/70">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 shrink-0 text-bordo/80" />
                      {tarihStr}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 shrink-0 text-bordo/80" />
                      Saat: {saatGoster}
                    </span>
                    {m.venue && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-bordo/80" />
                        {m.venue}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-bordo shrink-0">
                  {secili ? (
                    <ChevronUp className="h-6 w-6" />
                  ) : (
                    <ChevronDown className="h-6 w-6" />
                  )}
                  <span className="text-sm font-bold">
                    {secili ? "Bilet bölümü açık" : "Bilet al"}
                  </span>
                </div>
              </div>
            </button>

            {secili && (
              <div className="border-t-2 border-bordo/20 bg-gradient-to-br from-bordo/5 via-beyaz to-bordo/5 px-6 pb-7 pt-6">
                <div className="space-y-5">
                  <KoltukSecimi
                    matchId={m.id}
                    selectedSeatId={seciliMacId === m.id ? seciliKoltukId : null}
                    onSelect={(id, code) => {
                      setSeciliKoltukId(id);
                      setSeciliKoltukKod(code);
                    }}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bordo/15 shadow-inner">
                        <Ticket className="h-7 w-7 text-bordo" />
                      </div>
                      <div>
                        <p className="font-bold text-siyah">Ücretsiz bilet</p>
                        <p className="text-sm text-siyah/70">
                          {macLabel} — {tarihStr}
                          {saatStr ? ` · ${saatStr}` : ""}
                          {seciliKoltukId && seciliMacId === m.id && seciliKoltukKod && (
                            <span className="mt-1 block font-medium text-bordo">Koltuk: {seciliKoltukKod}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <BiletAlButton
                      matchId={m.id}
                      matchName={m.opponent_name}
                      seatId={seciliMacId === m.id ? seciliKoltukId : null}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
