"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const PRESETS = [1000, 5000, 10000, 50000, 100000];

export function BagisForm() {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session?.user);
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, []);

  const finalAmount = customAmount.trim() ? parseFloat(customAmount) : amount;
  const validAmount = finalAmount >= 10 && finalAmount <= 100_000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validAmount) {
      setError("Tutar 10 - 100.000 ₺ arasında olmalıdır.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/donation/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          message: message.trim() || undefined,
          email: email.trim() || undefined,
          name: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.paymentPageUrl) {
        window.location.href = data.data.paymentPageUrl;
        return;
      }
      setError(data.error || "Ödeme başlatılamadı.");
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
      {error && (
        <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-800">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-siyah">Tutar (₺) *</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setAmount(p); setCustomAmount(""); }}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                !customAmount && amount === p
                  ? "border-bordo bg-bordo text-beyaz"
                  : "border-siyah/20 text-siyah hover:border-bordo hover:bg-bordo/10"
              }`}
            >
              {p.toLocaleString("tr-TR")} ₺
            </button>
          ))}
        </div>
        <div className="mt-3">
          <input
            type="number"
            min={10}
            max={100000}
            step={1}
            placeholder="Özel tutar"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="w-full rounded-xl border border-siyah/20 px-4 py-2.5 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
      </div>
      {!signedIn && (
        <>
          <div className="mt-4">
            <label className="block text-sm font-medium text-siyah">Ad Soyad</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-siyah">E-posta *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5"
            />
          </div>
        </>
      )}
      <div className="mt-4">
        <label className="block text-sm font-medium text-siyah">Mesaj (isteğe bağlı)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5"
          placeholder="Bağışınızla ilgili kısa bir mesaj..."
        />
      </div>
      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !validAmount}
          className="rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz shadow-sm hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "Yönlendiriliyor..." : `${finalAmount} ₺ Bağış Yap`}
        </button>
        <p className="text-sm text-siyah/60">Güvenli ödeme (iyzico) ile yönlendirileceksiniz.</p>
      </div>
    </form>
  );
}
