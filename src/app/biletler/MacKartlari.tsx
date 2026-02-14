"use client";

import { useState } from "react";
import { BiletAlButton } from "./BiletAlButton";

type Match = {
  id: string;
  opponent_name: string;
  home_away: string;
  venue: string | null;
  match_date: string;
  competition: string | null;
};

export function MacKartlari({ matches }: { matches: Match[] }) {
  const [seciliMacId, setSeciliMacId] = useState<string | null>(null);

  if (!matches || matches.length === 0) return null;

  return (
    <div className="space-y-4">
      {matches.map((m) => {
        const secili = seciliMacId === m.id;
        const macLabel =
          m.home_away === "home"
            ? `Güngören FK - ${m.opponent_name}`
            : `${m.opponent_name} - Güngören FK`;
        return (
          <div
            key={m.id}
            className={`rounded-2xl border-2 bg-beyaz p-6 shadow-sm transition-all ${
              secili ? "border-bordo shadow-md" : "border-siyah/10 hover:border-siyah/20"
            }`}
          >
            <button
              type="button"
              onClick={() => setSeciliMacId(secili ? null : m.id)}
              className="w-full text-left"
            >
              <p className="font-semibold text-siyah">{macLabel}</p>
              <p className="mt-1 text-sm text-siyah/70">
                {new Date(m.match_date + "T12:00:00").toLocaleDateString("tr-TR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {m.venue && ` · ${m.venue}`}
              </p>
              {m.competition && (
                <p className="mt-1 text-xs text-siyah/50">{m.competition}</p>
              )}
              <p className="mt-3 text-sm font-medium text-bordo">
                {secili ? "▼ Bilet bölümü açık" : "▶ Bilet almak için maçı seçin"}
              </p>
            </button>
            {secili && (
              <div className="mt-6 border-t border-siyah/10 pt-6">
                <p className="mb-3 text-sm text-siyah/70">Bu maç için ücretsiz bilet alabilirsiniz.</p>
                <BiletAlButton matchId={m.id} matchName={m.opponent_name} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
