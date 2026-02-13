"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function TaraftarGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    router.push("/benim-kosem");
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

      <p className="mt-6 text-center text-sm text-siyah/70">
        Hesabın yok mu?{" "}
        <Link href="/taraftar/kayit" className="font-semibold text-bordo hover:underline">
          Taraftar ol
        </Link>
      </p>
    </div>
  );
}
