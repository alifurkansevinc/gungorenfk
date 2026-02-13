"use client";

import { useState, useEffect } from "react";

type Match = { id: string; opponent_name: string; match_date: string; venue: string | null };

export function BiletOlusturForm() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchId, setMatchId] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/matches-upcoming")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setMatches(d.data);
          if (d.data.length && !matchId) setMatchId(d.data[0].id);
        }
      })
      .catch(() => setMatches([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, quantity }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "ok", text: data.message || `${data.created} bilet oluşturuldu.` });
        setQuantity(10);
        window.location.reload();
      } else {
        setMessage({ type: "err", text: data.error || "Oluşturulamadı." });
      }
    } catch {
      setMessage({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">Bilet oluştur</h2>
      <p className="mt-1 text-sm text-gray-500">
        Maç seçip adet girin; benzersiz QR kodlu biletler oluşturulur. Koltuk şablonu ileride eklenecek.
      </p>
      {message && (
        <p
          className={`mt-4 rounded-xl p-3 text-sm ${
            message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Maç</label>
          <select
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
            required
          >
            <option value="">Maç seçin</option>
            {matches.map((m) => (
              <option key={m.id} value={m.id}>
                {new Date(m.match_date + "T12:00:00").toLocaleDateString("tr-TR")} – Güngören FK vs {m.opponent_name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700">Adet</label>
          <input
            type="number"
            min={1}
            max={500}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !matchId}
          className="rounded-xl bg-bordo px-6 py-2.5 font-semibold text-white hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "Oluşturuluyor..." : "Oluştur"}
        </button>
      </div>
    </form>
  );
}
