"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAdminByEmail } from "../../actions";

export function AdminKullaniciForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const res = await addAdminByEmail(email);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    setEmail("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-xl border border-siyah/10 bg-beyaz p-4">
      <h2 className="text-lg font-semibold text-siyah">Yeni admin ekle</h2>
      <p className="mt-1 text-sm text-siyah/60">E-posta ile ekleyin; bu e-posta Supabase Auth’da kayıtlı olmalı.</p>
      {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {success && <p className="mt-3 rounded bg-green-100 p-2 text-sm text-green-800">Admin eklendi.</p>}
      <div className="mt-4 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          required
          className="flex-1 rounded border border-siyah/20 px-3 py-2"
        />
        <button type="submit" disabled={loading} className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50">
          {loading ? "..." : "Ekle"}
        </button>
      </div>
    </form>
  );
}
