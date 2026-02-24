"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft } from "lucide-react";

export type Seat = {
  id: string;
  seat_code: string;
  section: string;
  row_number: number;
  seat_in_row: number;
};

/** Stadyum planı: 1 Taraftar Bölümü, 2–6 A–E blokları */
const SECTIONS = [
  { key: "Taraftar", label: "Taraftar Bölümü", hasSeats: false },
  { key: "A", label: "A Blok", hasSeats: true },
  { key: "B", label: "B Blok", hasSeats: true },
  { key: "C", label: "C Blok", hasSeats: true },
  { key: "D", label: "D Blok", hasSeats: true },
  { key: "E", label: "E Blok", hasSeats: true },
] as const;

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
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

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
      Object.keys(byBlock[sec] || {}).forEach((r) => {
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

  const isOverview = expandedBlock === null;

  const renderBlockSeats = (section: string) => {
    const rows = rowNumbersByBlock[section] ?? [];
    if (rows.length === 0) return null;
    return (
      <div className="flex flex-col gap-1">
        {rows.map((rowNum) => {
          const rowSeats = (blocks[section]?.[rowNum] ?? []).sort(
            (a, b) => a.seat_in_row - b.seat_in_row
          );
          return (
            <div
              key={`${section}-${rowNum}`}
              className="flex flex-wrap items-center justify-center gap-0.5"
            >
              <span className="mr-2 w-6 shrink-0 text-right text-xs font-medium text-siyah/60">
                {rowNum}
              </span>
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
                    className={`h-7 w-7 min-w-[1.75rem] rounded text-[10px] font-medium transition-all ${
                      taken
                        ? "cursor-not-allowed bg-bordo text-beyaz/90"
                        : selected
                          ? "border-2 border-bordo bg-bordo/25 text-bordo ring-2 ring-bordo/40"
                          : "border border-siyah/20 bg-beyaz text-siyah/70 hover:border-bordo/50 hover:bg-bordo/10 hover:text-bordo"
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
    );
  };

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

      {isOverview ? (
        <>
          <p className="text-center text-sm text-siyah/70">
            Koltuk seçmek için bir bölüme tıklayın; blok açılır ve koltukları seçebilirsiniz.
          </p>
          <div className="overflow-hidden rounded-2xl border-2 border-siyah/15 bg-gradient-to-b from-siyah/5 to-siyah/[0.02] shadow-xl">
            <div className="border-b border-siyah/10 bg-siyah/5 px-4 py-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-siyah/70">
                Stadyum planı — 6 bölüm (tek tribün)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3">
              {SECTIONS.map((sec, idx) => (
                <button
                  key={sec.key}
                  type="button"
                  onClick={() => setExpandedBlock(sec.key)}
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-siyah/15 bg-beyaz/90 py-6 shadow-sm transition-all hover:border-bordo/40 hover:bg-bordo/5 hover:shadow-md"
                >
                  <span className="text-[10px] font-medium text-siyah/50">
                    {idx + 1}
                  </span>
                  <span className="mt-1 text-sm font-bold uppercase text-siyah">
                    {sec.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center justify-center bg-[#2d5a27] px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
                Saha
              </span>
            </div>
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl border-2 border-siyah/15 bg-beyaz/95 shadow-xl">
          <div className="flex items-center justify-between border-b border-siyah/10 bg-siyah/5 px-4 py-2">
            <button
              type="button"
              onClick={() => setExpandedBlock(null)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-siyah/80 hover:bg-siyah/10 hover:text-siyah"
            >
              <ChevronLeft className="h-4 w-4" />
              Tüm bölümler
            </button>
            <span className="text-sm font-bold uppercase text-siyah">
              {SECTIONS.find((s) => s.key === expandedBlock)?.label ?? expandedBlock}
            </span>
            <span className="w-20" />
          </div>

          {expandedBlock === "Taraftar" ? (
            <div className="p-8 text-center text-siyah/70">
              <p className="font-medium">Taraftar Bölümü</p>
              <p className="mt-2 text-sm">
                Bu bölüm için koltuk planı henüz tanımlı değil.
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {renderBlockSeats(expandedBlock)}
            </div>
          )}
        </div>
      )}

      {selectedSeat && (
        <p className="text-center text-sm font-semibold text-bordo">
          Seçilen koltuk: <span className="font-mono">{selectedSeat.seat_code}</span>
        </p>
      )}
    </div>
  );
}
