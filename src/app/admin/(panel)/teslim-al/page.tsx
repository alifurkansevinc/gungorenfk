"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TeslimAlContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.trim()?.toUpperCase() || "";
  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) {
      setMessage({ type: "err", text: "Kod girin veya QR ile sayfaya gelin." });
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders/complete-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "ok", text: data.message + (data.orderNumber ? ` Sipariş: ${data.orderNumber}` : "") });
        setCode("");
      } else {
        setMessage({ type: "err", text: data.error || "İşlem başarısız." });
      }
    } catch {
      setMessage({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Mağazadan teslim al</h1>
      <p className="mt-1 text-siyah/70">
        Müşteri QR kodu gösterdiğinde bu sayfaya yönlenir veya kodu elle girin; &quot;Teslim alındı&quot; ile sipariş tamamlanır.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 max-w-md">
        {message && (
          <p
            className={`mb-4 rounded-lg p-3 text-sm ${
              message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </p>
        )}
        <label htmlFor="pickup-code" className="block text-sm font-medium text-siyah">
          Teslim kodu (QR ile gelen veya müşterinin ekranındaki kod)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="pickup-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Örn. A1B2C3D4"
            className="flex-1 rounded-lg border border-siyah/20 px-3 py-2.5 font-mono uppercase tracking-wider"
            maxLength={12}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-bordo px-6 py-2.5 font-bold text-beyaz hover:bg-bordo-dark disabled:opacity-50"
          >
            {loading ? "..." : "Teslim alındı"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TeslimAlPage() {
  return (
    <Suspense fallback={<div className="text-siyah/60">Yükleniyor...</div>}>
      <TeslimAlContent />
    </Suspense>
  );
}
