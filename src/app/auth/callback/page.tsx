"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"wait" | "form" | "done" | "error">("wait");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    function parseHash(hash: string): Record<string, string> {
      const params: Record<string, string> = {};
      hash.replace(/^#/, "").split("&").forEach((part) => {
        const [k, v] = part.split("=");
        if (k && v) params[k] = decodeURIComponent(v);
      });
      return params;
    }

    async function run() {
      if (searchParams.get("error") === "exchange") {
        setError("Link kullanılamadı. Lütfen şifre sıfırlama e-postasını, e-postayı açtığınız aynı tarayıcıda tekrar isteyip linke tıklayın.");
        setStep("error");
        return;
      }

      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");

      if (code) {
        const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeErr) {
          setError(exchangeErr.message);
          setStep("error");
          return;
        }
        setStep("form");
        return;
      }

      if (tokenHash && type === "recovery") {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (verifyErr) {
          setError(verifyErr.message);
          setStep("error");
          return;
        }
        setStep("form");
        return;
      }

      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = parseHash(window.location.hash);
        if (hashParams.type === "recovery" && hashParams.access_token) {
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token: hashParams.access_token,
            refresh_token: hashParams.refresh_token ?? "",
          });
          if (sessionErr) {
            setError(sessionErr.message);
            setStep("error");
            return;
          }
          setStep("form");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setStep("form");
        return;
      }

      setError("Geçersiz veya süresi dolmuş link. Lütfen tekrar şifre sıfırlama e-postası isteyin.");
      setStep("error");
    }

    run();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (form.elements.namedItem("confirm") as HTMLInputElement).value;
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setStep("done");
    setTimeout(() => router.replace("/admin/giris"), 2000);
  }

  if (step === "wait") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-siyah/70">Doğrulanıyor...</p>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-xl font-bold text-siyah">Şifre sıfırlama</h1>
        <p className="mt-2 rounded bg-red-100 p-3 text-sm text-red-800">{error}</p>
        <a href="/admin/giris" className="mt-4 inline-block text-bordo underline">Giriş sayfasına dön</a>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="rounded bg-green-100 p-3 text-green-800">Şifre güncellendi. Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-xl font-bold text-siyah">Yeni şifre belirleyin</h1>
      <p className="mt-1 text-sm text-siyah/60">En az 6 karakter.</p>
      {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-siyah">Yeni şifre</label>
          <input id="password" name="password" type="password" required minLength={6} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-siyah">Tekrar</label>
          <input id="confirm" name="confirm" type="password" required minLength={6} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        </div>
        <button type="submit" disabled={loading} className="w-full rounded bg-bordo py-3 font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50">
          {loading ? "..." : "Şifreyi güncelle"}
        </button>
      </form>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-siyah/70">Doğrulanıyor...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
