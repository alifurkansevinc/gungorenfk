"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const PRESETS = [1000, 5000, 10000, 50000, 100000];
const DEFAULT_MESSAGE = "Spor için Bağış";

export function BagisForm() {
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [donorType, setDonorType] = useState<"bireysel" | "sirket">("bireysel");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
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
    if (!name.trim()) {
      setError("Ad Soyad alanı zorunludur.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/donation/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          message: message.trim() || DEFAULT_MESSAGE,
          email: email.trim() || undefined,
          name: name.trim(),
          donor_type: donorType,
          title: donorType === "sirket" ? title.trim() || undefined : undefined,
          address: donorType === "sirket" ? address.trim() || undefined : undefined,
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

      <div className="mt-4">
        <label className="block text-sm font-medium text-siyah">Bağışçı türü</label>
        <div className="mt-2 flex gap-4">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="donor_type"
              checked={donorType === "bireysel"}
              onChange={() => setDonorType("bireysel")}
              className="rounded-full border-siyah/30 text-bordo"
            />
            <span className="text-sm">Bireysel</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="donor_type"
              checked={donorType === "sirket"}
              onChange={() => setDonorType("sirket")}
              className="rounded-full border-siyah/30 text-bordo"
            />
            <span className="text-sm">Şirket</span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-siyah">Adı Soyadı *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Adınız ve soyadınız"
          className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
        />
      </div>

      {donorType === "sirket" && (
        <>
          <div className="mt-4">
            <label className="block text-sm font-medium text-siyah">Ünvan</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Genel Müdür"
              className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5"
            />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-siyah">Adres</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Şirket adresi"
              className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5"
            />
          </div>
        </>
      )}

      {!signedIn && (
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
      )}

      <div className="mt-4">
        <label className="block text-sm font-medium text-siyah">Açıklama / Mesaj</label>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 w-full rounded-xl border border-siyah/20 px-4 py-2.5"
          placeholder={DEFAULT_MESSAGE}
        />
        <p className="mt-1 text-xs text-siyah/50">Varsayılan: Spor için Bağış</p>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading || !validAmount}
          className="rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz shadow-sm hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "Yönlendiriliyor..." : "Kredi kartı ile bağış yap"}
        </button>
        <p className="text-sm text-siyah/60">Güvenli ödeme (iyzico) ile yönlendirileceksiniz.</p>
      </div>
    </form>
  );
}
