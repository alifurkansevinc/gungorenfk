"use client";

import { useState } from "react";
import { resetUserPasswordByEmail } from "../../actions";

export function SifreSifirlaForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const res = await resetUserPasswordByEmail(email, password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    setEmail("");
    setPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-xl border border-siyah/10 bg-beyaz p-4">
      <h2 className="text-lg font-semibold text-siyah">Şifre sıfırla</h2>
      <p className="mt-1 text-sm text-siyah/60">
        Supabase Dashboard’da şifre alanı yok; buradan e-posta + yeni şifre ile kullanıcı şifresini güncelleyebilirsiniz.
      </p>
      {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {success && <p className="mt-3 rounded bg-green-100 p-2 text-sm text-green-800">Şifre güncellendi.</p>}
      <div className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta (örn. alifurkansevinc@gmail.com)"
          required
          className="w-full rounded border border-siyah/20 px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Yeni şifre (en az 6 karakter)"
          required
          minLength={6}
          className="w-full rounded border border-siyah/20 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "..." : "Şifreyi güncelle"}
        </button>
      </div>
    </form>
  );
}
