"use client";

import { useState, useEffect } from "react";

export type Seat = {
  id: string;
  seat_code: string;
  section: string;
  row_number: number;
  seat_in_row: number;
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<string>("");
  const [row, setRow] = useState<number | "">("");

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
        } else {
          setSeats(data.seats ?? []);
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

  const sections = Array.from(new Set(seats.map((s) => s.section))).sort();
  const rowsInSection = section
    ? Array.from(new Set(seats.filter((s) => s.section === section).map((s) => s.row_number))).sort((a, b) => a - b)
    : [];
  const seatsInRow =
    section && row !== ""
      ? seats.filter((s) => s.section === section && s.row_number === row).sort((a, b) => a.seat_in_row - b.seat_in_row)
      : [];

  const selectedSeat = seats.find((s) => s.id === selectedSeatId);

  if (loading) {
    return (
      <div className="rounded-xl border border-siyah/10 bg-siyah/5 p-4 text-center text-sm text-siyah/70">
        Koltuklar yükleniyor...
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
        Bu maç için müsait koltuk kalmadı.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-siyah">Koltuk seçin</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-medium text-siyah/70">Bölüm</label>
          <select
            value={section}
            onChange={(e) => {
              setSection(e.target.value);
              setRow("");
              onSelect(null, null);
            }}
            className="mt-1 w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah"
          >
            <option value="">Seçin</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-siyah/70">Sıra</label>
          <select
            value={row === "" ? "" : String(row)}
            onChange={(e) => {
              const v = e.target.value;
              setRow(v === "" ? "" : parseInt(v, 10));
              onSelect(null, null);
            }}
            disabled={!section}
            className="mt-1 w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah disabled:opacity-50"
          >
            <option value="">Seçin</option>
            {rowsInSection.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-siyah/70">Koltuk no</label>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {seatsInRow.length === 0 ? (
              <span className="py-2 text-sm text-siyah/50">
                {section && row !== "" ? "Bu sırada koltuk yok" : "Önce bölüm ve sıra seçin"}
              </span>
            ) : (
              seatsInRow.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSelect(s.id, s.seat_code)}
                  className={`min-w-[2.25rem] rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                    selectedSeatId === s.id
                      ? "bg-bordo text-beyaz"
                      : "bg-siyah/10 text-siyah hover:bg-bordo/20"
                  }`}
                >
                  {s.seat_in_row}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      {selectedSeat && (
        <p className="text-sm font-semibold text-bordo">
          Seçilen koltuk: <span className="font-mono">{selectedSeat.seat_code}</span>
        </p>
      )}
    </div>
  );
}
