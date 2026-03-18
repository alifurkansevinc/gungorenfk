"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signInAdmin, verifyBypass, createFirstAdminUser, hasAnyAdmin } from "../actions";

function getReasonMessage(reason: string | null): string | null {
  if (reason === "no_session")
    return "Oturum sunucuya iletilemedi. Lütfen tekrar giriş yapın veya sayfayı yenileyip deneyin.";
  if (reason === "not_admin") return "Bu hesap admin yetkisine sahip değil.";
  return null;
}

function AdminGirisForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bypassCode, setBypassCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [firstUserEmail, setFirstUserEmail] = useState("");
  const [firstUserPassword, setFirstUserPassword] = useState("");
  const [firstUserLoading, setFirstUserLoading] = useState(false);
  const [firstUserError, setFirstUserError] = useState<string | null>(null);
  const [firstUserSuccess, setFirstUserSuccess] = useState(false);
  const [showFirstUserForm, setShowFirstUserForm] = useState<boolean | null>(null);
  const reasonFromParams = searchParams.get("reason");
  const [reasonMessage, setReasonMessage] = useState<string | null>(() =>
    getReasonMessage(reasonFromParams)
  );

  useEffect(() => {
    hasAnyAdmin().then((has) => setShowFirstUserForm(!has));
  }, []);

  useEffect(() => {
    const msg = getReasonMessage(reasonFromParams);
    if (msg) {
      setReasonMessage(msg);
      return;
    }
    if (typeof window !== "undefined") {
      const r = new URLSearchParams(window.location.search).get("reason");
      setReasonMessage(getReasonMessage(r));
    }
  }, [reasonFromParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signInAdmin(email, password);
      if (!result.ok) {
        setError(result.error ?? "Giriş başarısız.");
        return;
      }
      window.location.href = "/admin";
    } finally {
      setLoading(false);
    }
  }

  async function handleFirstUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFirstUserError(null);
    setFirstUserSuccess(false);
    setFirstUserLoading(true);
    try {
      const result = await createFirstAdminUser(firstUserEmail, firstUserPassword);
      if (!result.ok) {
        setFirstUserError(result.error ?? "Oluşturulamadı.");
        return;
      }
      setFirstUserSuccess(true);
      setFirstUserEmail("");
      setFirstUserPassword("");
      window.location.href = "/admin/giris?created=1";
    } finally {
      setFirstUserLoading(false);
    }
  }

  async function handleBypass(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBypassLoading(true);
    try {
      const result = await verifyBypass(bypassCode);
      if (!result.ok) {
        setError(result.error ?? "Geçersiz bypass kodu");
        return;
      }
      window.location.href = "/admin";
      return;
    } finally {
      setBypassLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-siyah">Admin girişi</h1>
      <p className="mt-1 text-sm text-siyah/60">E-posta ve şifre ile giriş yapın. Hesabınızın admin olması gerekir.</p>

      {showFirstUserForm === false && (
        <p className="mt-2 text-xs text-siyah/50">Yeni panel kullanıcısı eklemek için giriş yaptıktan sonra Panel kullanıcıları sayfasını kullanın.</p>
      )}

      {showFirstUserForm === true && (
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-4">
          <h2 className="text-sm font-semibold text-green-900">İlk panel kullanıcısını oluştur</h2>
          <p className="mt-1 text-xs text-green-800">Henüz hiç kullanıcı yok. Aşağıdaki formla ilk admin hesabını oluşturun; ardından giriş yapabilirsiniz.</p>
          {firstUserError && <p className="mt-2 rounded bg-red-100 p-2 text-sm text-red-800">{firstUserError}</p>}
          {firstUserSuccess && <p className="mt-2 rounded bg-green-200 p-2 text-sm text-green-800">Hesap oluşturuldu. Giriş yapabilirsiniz.</p>}
          <form onSubmit={handleFirstUserSubmit} className="mt-3 space-y-3">
            <input
              type="email"
              value={firstUserEmail}
              onChange={(e) => setFirstUserEmail(e.target.value)}
              placeholder="E-posta"
              required
              className="w-full rounded border border-green-300 bg-white px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={firstUserPassword}
              onChange={(e) => setFirstUserPassword(e.target.value)}
              placeholder="Şifre (en az 6 karakter)"
              required
              minLength={6}
              className="w-full rounded border border-green-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={firstUserLoading}
              className="w-full rounded bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {firstUserLoading ? "Oluşturuluyor..." : "İlk kullanıcıyı oluştur"}
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {searchParams.get("created") === "1" && (
          <p className="rounded bg-green-100 p-2 text-sm text-green-800">Hesap oluşturuldu. Aşağıdan giriş yapın.</p>
        )}
        {reasonMessage && <p className="rounded bg-amber-100 p-2 text-sm text-amber-800">{reasonMessage}</p>}
        {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-siyah">E-posta</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded border border-black/20 px-3 py-2" placeholder="admin@example.com" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-siyah">Şifre</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded border border-black/20 px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-bordo py-3 font-medium text-beyaz hover:bg-bordo-dark disabled:opacity-50">
          {loading ? "Giriş yapılıyor..." : "Giriş yap"}
        </button>
      </form>

      <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-900">Şifremi unuttum</h2>
        <p className="mt-1 text-xs text-amber-800">
          E-posta adresinizi yazıp &quot;Sıfırlama linki gönder&quot;e tıklayın. Gelen linki <strong>aynı tarayıcıda</strong> açın. Supabase Redirect URLs’e <code className="rounded bg-amber-200 px-1">https://siteniz.com/api/auth/callback</code> ekleyin.
        </p>
        {resetError && <p className="mt-2 rounded bg-red-100 p-2 text-sm text-red-800">{resetError}</p>}
        {resetSent && <p className="mt-2 rounded bg-green-100 p-2 text-sm text-green-800">E-posta gönderildi. Gelen linke tıklayıp yeni şifre belirleyin.</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setResetError(null);
            setResetLoading(true);
            const supabase = createClient();
            const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : "";
            const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo });
            setResetLoading(false);
            if (err) { setResetError(err.message); return; }
            setResetSent(true);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            type="email"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            placeholder="E-posta adresiniz"
            required
            className="flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-sm"
          />
          <button type="submit" disabled={resetLoading} className="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
            {resetLoading ? "..." : "Sıfırlama linki gönder"}
          </button>
        </form>
      </div>

      <div className="mt-10 rounded-xl border border-siyah/10 bg-siyah/5 p-4">
        <p className="text-sm font-medium text-siyah/80">Geliştirici bypass</p>
        <p className="mt-1 text-xs text-siyah/60">.env içinde ADMIN_BYPASS_SECRET ile aynı kodu girin (isteğe bağlı).</p>
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
    </div>
  );
}

export default function AdminGirisPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center text-siyah/70">Yükleniyor...</div>}>
      <AdminGirisForm />
    </Suspense>
  );
}
