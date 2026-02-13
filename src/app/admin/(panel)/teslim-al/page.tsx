"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QrScanner } from "./QrScanner";
import { Camera } from "lucide-react";

function TeslimAlContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.trim()?.toUpperCase() || "";
  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [mode, setMode] = useState<"pickup" | "ticket">("pickup");

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  const submitCode = async (c: string) => {
    const trimmed = c.trim();
    if (!trimmed) return;
    setMessage(null);
    setLoading(true);
    try {
      if (mode === "ticket") {
        const res = await fetch("/api/admin/tickets/use", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qr_code: trimmed }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessage({ type: "ok", text: data.message || "Bilet kullanıldı." });
          setCode("");
          setShowScanner(false);
        } else {
          setMessage({ type: "err", text: data.error || "İşlem başarısız." });
        }
      } else {
        const codeUpper = trimmed.toUpperCase();
        const res = await fetch("/api/admin/orders/complete-pickup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: codeUpper }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMessage({ type: "ok", text: data.message + (data.orderNumber ? ` Sipariş: ${data.orderNumber}` : "") });
          setCode("");
          setShowScanner(false);
        } else {
          setMessage({ type: "err", text: data.error || "İşlem başarısız." });
        }
      }
    } catch {
      setMessage({ type: "err", text: "Bağlantı hatası." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage({ type: "err", text: "Kod girin veya QR ile sayfaya gelin." });
      return;
    }
    await submitCode(code);
  };

  const handleQrScan = (scannedCode: string) => {
    setCode(scannedCode);
    submitCode(scannedCode);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mağazadan teslim al</h1>
        <p className="mt-1 text-gray-500">
          Müşteri QR kodu gösterdiğinde kamerayı açın veya kodu elle girin; sipariş teslim alındı olarak işaretlenir.
        </p>
      </div>

      {message && (
        <p
          className={`rounded-xl p-4 text-sm ${
            message.type === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </p>
      )}

      {!showScanner ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setMode("pickup"); setShowScanner(true); }}
              className="inline-flex items-center gap-2 rounded-xl bg-bordo px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-bordo/90"
            >
              <Camera className="h-5 w-5" />
              Sipariş teslim (QR tara)
            </button>
            <button
              type="button"
              onClick={() => { setMode("ticket"); setShowScanner(true); }}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Camera className="h-5 w-5" />
              Bilet kullan (QR tara)
            </button>
          </div>
          <form onSubmit={handleSubmit} className="max-w-md">
            <label htmlFor="pickup-code" className="block text-sm font-medium text-gray-700">
              {mode === "ticket" ? "Bilet QR kodunu elle girin" : "Veya teslim kodunu elle girin"}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="pickup-code"
                type="text"
                value={code}
                onChange={(e) => setCode(mode === "pickup" ? e.target.value.toUpperCase() : e.target.value)}
                placeholder="Örn. A1B2C3D4"
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-mono uppercase tracking-wider focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-bordo px-6 py-2.5 font-bold text-white disabled:opacity-50 hover:bg-bordo/90"
              >
                {loading ? "..." : "Teslim alındı"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-600">
            {mode === "ticket" ? "Maç biletinin QR kodunu tarayın." : "Sipariş teslim kodunu tarayın."}
          </p>
          <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />
        </>
      )}
    </div>
  );
}

export default function TeslimAlPage() {
  return (
    <Suspense fallback={<div className="text-gray-500">Yükleniyor...</div>}>
      <TeslimAlContent />
    </Suspense>
  );
}
