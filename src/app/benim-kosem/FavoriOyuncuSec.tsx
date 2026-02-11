"use client";

import { useState } from "react";
import { updateFavoritePlayer } from "@/app/actions/fan";
import type { SquadMember } from "@/types/db";

type Props = {
  currentFavoriteId: string | null;
  squad: (SquadMember & { id: string })[];
};

export function FavoriOyuncuSec({ currentFavoriteId, squad }: Props) {
  const [value, setValue] = useState(currentFavoriteId ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<"ok" | "error" | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value || null;
    setValue(id ?? "");
    setLoading(true);
    setMessage(null);
    const result = await updateFavoritePlayer(id);
    setLoading(false);
    setMessage(result.error ? "error" : "ok");
  }

  return (
    <div>
      <label htmlFor="favori_oyuncu" className="block text-sm font-medium text-siyah/80">Favori oyuncun</label>
      <select
        id="favori_oyuncu"
        value={value}
        onChange={handleChange}
        disabled={loading}
        className="mt-1 w-full max-w-xs rounded-lg border border-siyah/20 px-3 py-2 text-siyah disabled:opacity-60"
      >
        <option value="">Seç...</option>
        {squad.map((p) => (
          <option key={p.id} value={p.id}>
            {p.shirt_number != null ? `${p.shirt_number}. ` : ""}{p.name} {p.position ? `(${p.position})` : ""}
          </option>
        ))}
      </select>
      {message === "ok" && <p className="mt-1 text-sm text-green-600">Kaydedildi.</p>}
      {message === "error" && <p className="mt-1 text-sm text-red-600">Kaydedilemedi.</p>}
    </div>
  );
}
