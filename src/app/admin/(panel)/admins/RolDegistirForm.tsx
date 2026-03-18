"use client";

import { useMemo, useState } from "react";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";
import { getAdminUserRoleByEmail, updateAdminRoleByEmail } from "../../actions";

const ROLES: AdminRole[] = ["admin", "operator", "club_manager", "football_director", "event_coordinator"];

export function RolDegistirForm() {
  const [email, setEmail] = useState("");
  const [currentLabel, setCurrentLabel] = useState<string>("Henüz sorgulanmadı.");
  const [selectedRole, setSelectedRole] = useState<AdminRole>("operator");
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canUpdate = useMemo(() => email.trim().length > 0, [email]);

  async function handleLookup() {
    const trimmed = email.trim();
    setError(null);
    setSuccess(null);
    setLookupLoading(true);
    try {
      const res = await getAdminUserRoleByEmail(trimmed);
      if (!res.ok || !res.data) {
        setCurrentLabel(res.error ?? "Kullanıcı bulunamadı.");
        return;
      }
      setCurrentLabel(res.data.panelRoleLabel);
      if (res.data.panelRole) {
        setSelectedRole(res.data.panelRole);
      }
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await updateAdminRoleByEmail(email, selectedRole);
      if (!res.ok) {
        setError(res.error ?? "Rol güncellenemedi.");
        return;
      }
      setSuccess(`Rol güncellendi: ${ADMIN_ROLE_LABELS[selectedRole]}`);
      await handleLookup();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleUpdate} className="mt-6 max-w-md rounded-xl border border-siyah/10 bg-beyaz p-4">
      <h2 className="text-lg font-semibold text-siyah">Rol değiştir</h2>
      <p className="mt-1 text-sm text-siyah/60">
        E-posta girip önce mevcut rolü görün, sonra yeni rolü seçip güncelleyin. Panel yetkisi olmayan kullanıcılar için mevcut durum &quot;Taraftar / panel yetkisi yok&quot; olarak görünür.
      </p>
      {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      {success && <p className="mt-3 rounded bg-green-100 p-2 text-sm text-green-800">{success}</p>}
      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-posta"
            required
            className="flex-1 rounded border border-siyah/20 px-3 py-2"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!canUpdate || lookupLoading}
            className="rounded bg-siyah px-4 py-2 text-sm font-medium text-beyaz hover:bg-siyah/90 disabled:opacity-50"
          >
            {lookupLoading ? "..." : "Rolü getir"}
          </button>
        </div>
        <div className="rounded border border-siyah/10 bg-siyah/5 px-3 py-2 text-sm text-siyah/80">
          Mevcut durum: <span className="font-medium">{currentLabel}</span>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-siyah">Yeni rol</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
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
          disabled={!canUpdate || loading}
          className="w-full rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50"
        >
          {loading ? "..." : "Rolü değiştir"}
        </button>
      </div>
    </form>
  );
}
