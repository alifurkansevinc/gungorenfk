"use client";

import { useState } from "react";
import { Ticket, Loader2 } from "lucide-react";

export function EtkinlikBiletAlButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets/purchase/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      const data = await res.json();
      if (res.status === 401 && data.loginUrl) {
        window.location.href = data.loginUrl;
        return;
      }
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
      className="group relative inline-flex shrink-0 items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-bordo to-bordo-dark px-8 py-3 font-bold text-beyaz shadow-xl shadow-bordo/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-bordo/40 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-80"
    >
      <span className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {loading ? (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-beyaz/20">
          <Ticket className="h-4 w-4" aria-hidden />
        </span>
      )}
      <span className="relative text-base">
        {loading ? "Hazırlanıyor..." : "Ücretsiz Bilet Al"}
      </span>
    </button>
  );
}
