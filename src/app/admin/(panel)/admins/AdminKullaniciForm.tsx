"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addAdminUser } from "../../actions";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";

const ROLES: AdminRole[] = ["admin", "operator", "club_manager", "football_director", "event_coordinator"];

export function AdminKullaniciForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("operator");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    const res = await addAdminUser(email, password.trim() || null, role);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    setEmail("");
    setPassword("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-xl border border-siyah/10 bg-beyaz p-4">
      <h2 className="text-lg font-semibold text-siyah">Yeni panel kullanıcısı ekle</h2>
      <p className="mt-1 text-sm text-siyah/60">
        E-posta ve şifre ile yeni kullanıcı oluşturulur; şifre boş bırakılırsa bu e-posta ile mevcut Auth kullanıcısı panele eklenir (rol atanır).
      </p>
      {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {success && <p className="mt-3 rounded bg-green-100 p-2 text-sm text-green-800">Kullanıcı işlendi. Rol güncellenmiş olabilir.</p>}
      <div className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-posta"
          required
          className="w-full rounded border border-siyah/20 px-3 py-2"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Şifre (yeni kullanıcı için en az 6 karakter; boş bırakırsanız mevcut kullanıcı eklenir)"
          minLength={6}
          className="w-full rounded border border-siyah/20 px-3 py-2"
        />
        <div>
          <label className="mb-1 block text-sm font-medium text-siyah">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
            className="w-full rounded border border-siyah/20 px-3 py-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ADMIN_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "..." : "Ekle"}
        </button>
      </div>
    </form>
  );
}
