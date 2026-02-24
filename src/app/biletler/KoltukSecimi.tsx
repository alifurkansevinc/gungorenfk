"use client";

import { useState, useEffect, useMemo } from "react";

export type Seat = {
  id: string;
  seat_code: string;
  section: string;
  row_number: number;
  seat_in_row: number;
};

const BLOCK_ORDER = ["A", "B", "C", "D", "E"];

export function KoltukSecimi({
  matchId,
  selectedSeatId,
  onSelect,
}: {
  matchId: string;
  selectedSeatId: string | null;
  onSelect: (seatId: string | null, seatCode: string | null) => void;
}) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [takenIds, setTakenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/available-seats?matchId=${encodeURIComponent(matchId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          setSeats([]);
          setTakenIds(new Set());
        } else {
          setSeats(data.seats ?? []);
          setTakenIds(new Set(data.takenIds ?? []));
        }
      })
      .catch(() => {
        if (!cancelled) setError("Koltuklar yüklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const blocks = useMemo(() => {
    const byBlock: Record<string, Record<number, Seat[]>> = {};
    BLOCK_ORDER.forEach((sec) => {
      byBlock[sec] = {};
    });
    seats.forEach((s) => {
      if (!byBlock[s.section]) byBlock[s.section] = {};
      if (!byBlock[s.section][s.row_number]) byBlock[s.section][s.row_number] = [];
      byBlock[s.section][s.row_number].push(s);
    });
    BLOCK_ORDER.forEach((sec) => {
      Object.keys(byBlock[sec]).forEach((r) => {
        const row = Number(r);
        byBlock[sec][row].sort((a, b) => a.seat_in_row - b.seat_in_row);
      });
    });
    return byBlock;
  }, [seats]);

  const rowNumbersByBlock = useMemo(() => {
    const out: Record<string, number[]> = {};
    BLOCK_ORDER.forEach((sec) => {
      const rows = Object.keys(blocks[sec] || {})
        .map(Number)
        .sort((a, b) => b - a);
      out[sec] = rows;
    });
    return out;
  }, [blocks]);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  if (loading) {
    return (
      <div className="rounded-xl border border-siyah/10 bg-siyah/5 p-6 text-center text-sm text-siyah/70">
        Stadyum koltuk planı yükleniyor...
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {error}
      </div>
    );
  }
  if (seats.length === 0) {
    return (
      <div className="rounded-xl border border-siyah/10 bg-siyah/5 p-4 text-center text-sm text-siyah/70">
        Koltuk bilgisi bulunamadı.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Açıklama */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-siyah/80">
        <span className="flex items-center gap-2">
          <span className="h-5 w-5 rounded border border-siyah/25 bg-beyaz shadow-sm" />
          Boş
        </span>
        <span className="flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-bordo shadow-sm" />
          Dolu
        </span>
        <span className="flex items-center gap-2">
          <span className="h-5 w-5 rounded border-2 border-bordo bg-bordo/20 ring-1 ring-bordo/30" />
          Seçili
        </span>
      </div>

      {/* Tek tribün — stadyum planı */}
      <div className="overflow-hidden rounded-2xl border-2 border-siyah/15 bg-gradient-to-b from-siyah/5 to-siyah/[0.02] shadow-xl">
        {/* Tribün başlığı */}
        <div className="border-b border-siyah/10 bg-siyah/5 px-4 py-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-siyah/70">
            Tek tribün — koltuk planı (Excel)
          </p>
        </div>

        {/* Bloklar: yan yana tek tribün, 7 bölüm konsepti (A–E veri + görsel bölümleme) */}
        <div className="flex flex-1 flex-wrap items-stretch justify-center gap-0 border-b border-siyah/10 p-3 sm:p-4">
          {BLOCK_ORDER.map((section) => {
            const rows = rowNumbersByBlock[section] ?? [];
            if (rows.length === 0) return null;
            return (
              <div
                key={section}
                className="flex flex-col rounded-lg border border-siyah/15 bg-beyaz/80 px-2 py-2 shadow-sm min-w-[4rem] flex-1 max-w-[12rem]"
              >
                <div className="mb-1.5 text-center">
                  <span className="rounded bg-siyah/10 px-2 py-0.5 text-xs font-bold uppercase text-siyah">
                    {section}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {rows.map((rowNum) => {
                    const rowSeats = (blocks[section]?.[rowNum] ?? []).sort(
                      (a, b) => a.seat_in_row - b.seat_in_row
                    );
                    return (
                      <div
                        key={`${section}-${rowNum}`}
                        className="flex flex-wrap items-center justify-center gap-px"
                      >
                        {rowSeats.map((seat) => {
                          const taken = takenIds.has(seat.id);
                          const selected = selectedSeatId === seat.id;
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={taken}
                              onClick={() =>
                                onSelect(taken ? null : seat.id, taken ? null : seat.seat_code)
                              }
                              title={taken ? "Dolu" : seat.seat_code}
                              className={`h-4 w-4 min-w-[1rem] rounded-sm text-[9px] font-medium transition-all ${
                                taken
                                  ? "cursor-not-allowed bg-bordo text-beyaz/90"
                                  : selected
                                    ? "border-2 border-bordo bg-bordo/25 text-bordo ring-1 ring-bordo/50"
                                    : "border border-siyah/15 bg-beyaz text-siyah/60 hover:border-bordo/40 hover:bg-bordo/10 hover:text-bordo"
                              }`}
                            >
                              {seat.seat_in_row}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Saha çizgisi — tribünün önü */}
        <div className="flex items-center justify-center gap-2 bg-[#2d5a27] px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
            Saha
          </span>
        </div>
      </div>

      {selectedSeat && (
        <p className="text-center text-sm font-semibold text-bordo">
          Seçilen koltuk: <span className="font-mono">{selectedSeat.seat_code}</span>
        </p>
      )}
    </div>
  );
}
