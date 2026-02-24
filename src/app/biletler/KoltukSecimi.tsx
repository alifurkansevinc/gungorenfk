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
  const [taraftarCapacity, setTaraftarCapacity] = useState(1000);
  const [taraftarSold, setTaraftarSold] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);

  const validMatchId = typeof matchId === "string" && matchId.trim().length > 0;

  useEffect(() => {
    if (!validMatchId) {
      setLoading(false);
      setError("Maç bilgisi eksik.");
      setSeats([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/tickets/available-seats?matchId=${encodeURIComponent(matchId.trim())}`)
      .then((r) => r.json().catch(() => ({})))
      .then((data: unknown) => {
        if (cancelled) return;
        try {
          const d = data as Record<string, unknown>;
          if (d && d.error) {
            setError(String(d.error));
            setSeats([]);
            setTakenIds(new Set());
            return;
          }
          const raw = Array.isArray(d?.seats) ? d.seats : [];
          const safe: Seat[] = raw.filter((s: unknown) => s && typeof (s as Seat).id === "string").map((s: unknown) => {
            const x = s as Record<string, unknown>;
            return {
              id: String(x.id),
              seat_code: typeof x.seat_code === "string" ? x.seat_code : String(x.id ?? ""),
              section: typeof x.section === "string" ? x.section : "",
              row_number: Number(x.row_number) || 0,
              seat_in_row: Number(x.seat_in_row) || 0,
            } as Seat;
          });
          setSeats(safe);
          const taken = Array.isArray(d?.takenIds) ? d.takenIds.filter((id: unknown) => typeof id === "string") : [];
          setTakenIds(new Set(taken));
          setTaraftarCapacity(Number(d?.taraftarCapacity) || 1000);
          setTaraftarSold(Number(d?.taraftarSold) || 0);
        } catch {
          if (!cancelled) setError("Koltuk verisi işlenemedi.");
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
  }, [matchId, validMatchId]);

  const blocks = useMemo(() => {
    try {
      const byBlock: Record<string, Record<number, Seat[]>> = {};
      BLOCK_ORDER.forEach((sec) => {
        byBlock[sec] = {};
      });
      const list = Array.isArray(seats) ? seats : [];
      list.forEach((s) => {
        if (!s || typeof s.id !== "string") return;
        const sec = String(s.section != null ? s.section : "").toUpperCase();
        if (!BLOCK_ORDER.includes(sec)) return;
        const row = Number(s.row_number);
        if (Number.isNaN(row)) return;
        if (!byBlock[sec][row]) byBlock[sec][row] = [];
        byBlock[sec][row].push(s);
      });
      BLOCK_ORDER.forEach((sec) => {
        Object.keys(byBlock[sec] || {}).forEach((r) => {
          const row = Number(r);
          if (!Number.isNaN(row) && Array.isArray(byBlock[sec][row])) {
            byBlock[sec][row].sort((a, b) => (Number(a.seat_in_row) || 0) - (Number(b.seat_in_row) || 0));
          }
        });
      });
      return byBlock;
    } catch {
      const empty: Record<string, Record<number, Seat[]>> = {};
      BLOCK_ORDER.forEach((sec) => {
        empty[sec] = {};
      });
      return empty;
    }
  }, [seats]);

  const rowNumbersByBlock = useMemo(() => {
    try {
      const out: Record<string, number[]> = {};
      BLOCK_ORDER.forEach((sec) => {
        const keys = Object.keys(blocks[sec] ?? {});
        const rows = keys
          .map((r) => Number(r))
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => b - a);
        out[sec] = rows;
      });
      return out;
    } catch {
      const out: Record<string, number[]> = {};
      BLOCK_ORDER.forEach((sec) => {
        out[sec] = [];
      });
      return out;
    }
  }, [blocks]);

  const emptyCountByBlock = useMemo(() => {
    try {
      const out: Record<string, number> = {
        Taraftar: Math.max(0, (Number(taraftarCapacity) || 0) - (Number(taraftarSold) || 0)),
      };
      BLOCK_ORDER.forEach((sec) => {
        const list = Array.isArray(seats) ? seats : [];
        const blockSeats = list.filter((s) => s && String(s.section != null ? s.section : "").toUpperCase() === sec);
        out[sec] = blockSeats.filter((s) => s && !takenIds.has(s.id)).length;
      });
      return out;
    } catch {
      const out: Record<string, number> = { Taraftar: 0 };
      BLOCK_ORDER.forEach((sec) => {
        out[sec] = 0;
      });
      return out;
    }
  }, [seats, takenIds, taraftarCapacity, taraftarSold]);

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  if (!validMatchId) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Maç bilgisi eksik. Sayfayı yenileyin.
      </div>
    );
  }
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

  const seatLabel = (seat: Seat) => {
    const code = seat?.seat_code;
    if (code == null || typeof code !== "string") return String(seat?.seat_in_row ?? "?");
    const parts = code.split("-");
    return parts.length > 0 ? parts[parts.length - 1] : String(seat.seat_in_row);
  };

  const blockMaxColumn = useMemo(() => {
    try {
      const out: Record<string, number> = {};
      const list = Array.isArray(seats) ? seats : [];
      BLOCK_ORDER.forEach((sec) => {
        const sectionSeats = list.filter((s) => s && String(s.section != null ? s.section : "").toUpperCase() === sec);
        const max =
          sectionSeats.length > 0
            ? Math.max(...sectionSeats.map((s) => Number(s.seat_in_row) || 0))
            : 0;
        out[sec] = Math.max(1, max);
      });
      return out;
    } catch {
      const out: Record<string, number> = {};
      BLOCK_ORDER.forEach((sec) => {
        out[sec] = 24;
      });
      return out;
    }
  }, [seats]);

  const renderBlockSeats = (section: string) => {
    const rows = rowNumbersByBlock[section] ?? [];
    if (rows.length === 0) return null;
    const totalCols = Math.max(1, blockMaxColumn[section] ?? 24);
    return (
      <div className="flex flex-col gap-1">
        {rows.map((rowNum) => {
          const rawRow = blocks[section]?.[rowNum] ?? [];
          const rowSeats = Array.isArray(rawRow)
            ? [...rawRow].sort((a, b) => (Number(a.seat_in_row) || 0) - (Number(b.seat_in_row) || 0))
            : [];
          const seatsByPos = new Map(rowSeats.map((s) => [s.seat_in_row, s]));
          return (
            <div
              key={`${section}-${rowNum}`}
              className="flex flex-nowrap items-center gap-0.5"
            >
              <span className="w-8 shrink-0 text-right text-sm font-bold text-siyah">
                {rowNum}
              </span>
              <div className="flex flex-nowrap items-center justify-start gap-0.5 py-0.5">
                {Array.from({ length: totalCols }, (_, i) => i + 1).map((pos) => {
                  const seat = seatsByPos.get(pos);
                  if (!seat) {
                    return (
                      <span
                        key={`gap-${section}-${rowNum}-${pos}`}
                        className="h-7 w-7 min-w-[1.75rem] max-w-[1.75rem] shrink-0 rounded bg-siyah/10"
                        title="Koridor / Merdiven"
                        aria-hidden
                      />
                    );
                  }
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
                      title={taken ? "Dolu" : (seat?.seat_code ?? seat?.id ?? "")}
                      className={`h-7 w-7 min-w-[1.75rem] max-w-[1.75rem] shrink-0 rounded text-[10px] font-medium transition-all ${
                        taken
                          ? "cursor-not-allowed bg-bordo text-beyaz/90"
                          : selected
                            ? "border-2 border-bordo bg-bordo/25 text-bordo ring-2 ring-bordo/40"
                            : "border border-siyah/20 bg-beyaz text-siyah/70 hover:border-bordo/50 hover:bg-bordo/10 hover:text-bordo"
                      }`}
                    >
                      {seatLabel(seat)}
                    </button>
                  );
                })}
              </div>
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
            <div className="overflow-x-auto border-b border-siyah/10 p-2 sm:p-3">
              <div className="flex min-w-max flex-nowrap items-stretch justify-center gap-1 sm:gap-2">
              {SECTIONS.map((sec, idx) => {
                const emptyCount = emptyCountByBlock[sec.key] ?? 0;
                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setExpandedBlock(sec.key)}
                    className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border-2 border-siyah/15 bg-beyaz/90 py-3 shadow-sm transition-all hover:border-bordo/40 hover:bg-bordo/5 hover:shadow-md sm:py-4"
                  >
                    <span className="text-[10px] font-medium text-siyah/50">
                      {idx + 1}
                    </span>
                    <span className="mt-0.5 text-xs font-bold uppercase text-siyah sm:text-sm">
                      {sec.label}
                    </span>
                    <span className="mt-1 text-xs font-semibold text-bordo">
                      {sec.key === "Taraftar" ? `${emptyCountByBlock["Taraftar"]} boş` : sec.hasSeats ? `${emptyCount} boş` : "—"}
                    </span>
                  </button>
                );
              })}
              </div>
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
            <div className="p-6 text-center">
              <p className="font-bold text-siyah">Taraftar Bölümü</p>
              <p className="mt-2 text-sm text-siyah/70">
                Sıra ve koltuk numarası yok; {taraftarCapacity} kişilik bölüm. Taraftar biletini seçmek için aşağıdaki butona tıklayın.
              </p>
              <p className="mt-2 text-sm font-medium text-bordo">
                {Math.max(0, taraftarCapacity - taraftarSold)} bilet kaldı
              </p>
              <button
                type="button"
                onClick={() => onSelect(null, "TARAFTAR")}
                className="mt-4 rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz shadow-lg hover:bg-bordo-dark"
              >
                Taraftar biletini seç
              </button>
            </div>
          ) : (rowNumbersByBlock[expandedBlock]?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-siyah/70">
              <p className="font-medium">{SECTIONS.find((s) => s.key === expandedBlock)?.label ?? expandedBlock}</p>
              <p className="mt-2 text-sm">
                Bu blok için koltuk verisi veritabanında görünmüyor. Yönetici: Supabase SQL Editor’da{" "}
                <code className="rounded bg-siyah/10 px-1 text-xs">029_stadium_seats_e_block.sql</code> migration’ını çalıştırın.
              </p>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden p-4">
              <div className="w-max min-w-full max-w-6xl mx-auto">
                {renderBlockSeats(expandedBlock)}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedSeat && (
        <p className="text-center text-sm font-semibold text-bordo">
          Seçilen koltuk: <span className="font-mono">{selectedSeat?.seat_code ?? selectedSeat?.id ?? "—"}</span>
        </p>
      )}
    </div>
  );
}
