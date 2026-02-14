"use client";

import { useState } from "react";
import { Ticket, Loader2 } from "lucide-react";

export function BiletAlButton({ matchId, matchName }: { matchId: string; matchName: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/purchase/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (data.success && data.data?.redirectUrl) {
        window.location.href = data.data.redirectUrl;
        return;
      }
      if (data.success && data.data?.paymentPageUrl) {
        window.location.href = data.data.paymentPageUrl;
        return;
      }
      alert(data.error || "Bilet alınamadı.");
    } catch {
      alert("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-bordo px-8 py-4 font-bold text-beyaz shadow-lg shadow-bordo/25 transition-all duration-300 hover:scale-[1.02] hover:bg-bordo-dark hover:shadow-xl hover:shadow-bordo/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Ticket className="h-5 w-5 shrink-0" />
      )}
      <span>
        {loading ? "Hazırlanıyor..." : "Ücretsiz Bilet Al"}
      </span>
    </button>
  );
}
