"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AdminGirisPage() {
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
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const { data: adminRow } = await supabase.from("admin_users").select("id").eq("user_id", data.user.id).single();
    if (!adminRow) {
      await supabase.auth.signOut();
      setError("Bu hesap admin değil.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-xl font-bold text-siyah">Admin Girişi</h1>
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
          {loading ? "Giriş yapılıyor..." : "Giriş"}
        </button>
      </form>
    </div>
  );
}
