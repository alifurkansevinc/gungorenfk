"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function TaraftarGirisContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "";
  const redirectTo = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/benim-kosem";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Giriş Yap</h1>
      <p className="mt-2 text-siyah/70">
        Taraftar hesabınla giriş yap; rozetini, favori oyuncunu ve hesabını buradan yönet.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-siyah">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2.5 text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-siyah">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2.5 text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-bordo py-3 font-semibold text-beyaz transition-colors hover:bg-bordo-dark disabled:opacity-50"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>

      <div className="mt-6 rounded-xl border border-siyah/10 bg-siyah/[0.03] p-4">
        <h2 className="text-sm font-semibold text-siyah">Şifremi unuttum</h2>
        <p className="mt-1 text-xs text-siyah/60">
          E-posta adresinizi yazıp sıfırlama linki gönderin. Gelen linke tıklayıp yeni şifre belirleyin.
        </p>
        {resetError && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-800">{resetError}</p>}
        {resetSent && <p className="mt-2 rounded bg-green-50 p-2 text-sm text-green-800">E-posta gönderildi. Gelen linke tıklayıp yeni şifre belirleyin.</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setResetError(null);
            setResetLoading(true);
            const supabase = createClient();
            const redirectToUrl = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback` : "";
            const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: redirectToUrl });
            setResetLoading(false);
            if (err) {
              setResetError(err.message);
              return;
            }
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
            className="flex-1 rounded-lg border border-siyah/20 px-3 py-2.5 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          />
          <button type="submit" disabled={resetLoading} className="rounded-lg bg-siyah px-4 py-2.5 text-sm font-medium text-beyaz hover:bg-siyah/90 disabled:opacity-50">
            {resetLoading ? "..." : "Link gönder"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-siyah/70">
        Hesabın yok mu?{" "}
        <Link href="/taraftar/kayit" className="font-semibold text-bordo hover:underline">
          Taraftar ol
        </Link>
      </p>
    </div>
  );
}

export default function TaraftarGirisPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-siyah/70">Yükleniyor...</p></div>}>
      <TaraftarGirisContent />
    </Suspense>
  );
}
