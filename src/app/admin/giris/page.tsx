"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { checkIsAdmin, verifyBypass } from "../actions";

export default function AdminGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bypassCode, setBypassCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const result = await checkIsAdmin(data.user.id);
    if (!result.isAdmin) {
      await supabase.auth.signOut();
      setError(
        result.error
          ? `Admin kontrolü başarısız: ${result.error}`
          : "Bu hesap admin değil. admin_users tablosunda bu hesabın user_id'si olmalı."
      );
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  async function handleBypass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBypassLoading(true);
    const result = await verifyBypass(bypassCode);
    if (!result.ok) {
      setError(result.error ?? "Geçersiz bypass kodu");
      setBypassLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-siyah">Admin Girişi</h1>

      {/* Bypass ile giriş (geçici) */}
      <div className="mt-8 rounded-xl border border-siyah/15 bg-siyah/5 p-4">
        <p className="text-sm font-medium text-siyah/80">Bypass ile giriş (geçici)</p>
        <p className="mt-1 text-xs text-siyah/60">.env içinde ADMIN_BYPASS_SECRET ile aynı kodu girin.</p>
        <form onSubmit={handleBypass} className="mt-3 flex gap-2">
          <input
            type="password"
            value={bypassCode}
            onChange={(e) => setBypassCode(e.target.value)}
            placeholder="Bypass kodu"
            className="flex-1 rounded border border-black/20 px-3 py-2 text-sm"
            autoComplete="off"
          />
          <button type="submit" disabled={bypassLoading} className="rounded bg-siyah px-4 py-2 text-sm font-medium text-beyaz hover:bg-siyah/90 disabled:opacity-50">
            {bypassLoading ? "..." : "Giriş"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-siyah/50">veya</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-siyah">E-posta</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded border border-black/20 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-siyah">Şifre</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded border border-black/20 px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-bordo py-2 font-medium text-beyaz hover:bg-bordo-dark disabled:opacity-50">
          {loading ? "Giriş yapılıyor..." : "Supabase ile giriş"}
        </button>
      </form>
    </div>
  );
}
