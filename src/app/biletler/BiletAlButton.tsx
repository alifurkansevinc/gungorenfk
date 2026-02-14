"use client";

import { useState } from "react";

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
      className="shrink-0 rounded-xl bg-bordo px-6 py-2.5 font-bold text-beyaz hover:bg-bordo/90 disabled:opacity-50"
    >
      {loading ? "Yönlendiriliyor..." : "Ücretsiz Bilet Al"}
    </button>
  );
}
