"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminUserRoleByEmail,
  updateAdminRoleByEmail,
  resetUserPasswordByEmail,
  addAdminUser,
  hasAdminUserRoleColumn,
} from "../../actions";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";

const ROLES: AdminRole[] = ["admin", "operator", "club_manager", "football_director", "event_coordinator"];

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "found"; email: string; authExists: boolean; panelRole: AdminRole | null; panelRoleLabel: string }
  | { status: "not_found"; email: string; error: string };

export function KullaniciYonetimi() {
  const router = useRouter();
  const [searchEmail, setSearchEmail] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const [roleColumnExists, setRoleColumnExists] = useState<boolean | null>(null);

  // Rol / şifre formu (arama sonucu için)
  const [selectedRole, setSelectedRole] = useState<AdminRole>("operator");
  const [newPassword, setNewPassword] = useState("");
  const [roleSaveLoading, setRoleSaveLoading] = useState(false);
  const [passwordSaveLoading, setPasswordSaveLoading] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Yeni kullanıcı formu
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<AdminRole>("operator");
  const [newUserLoading, setNewUserLoading] = useState(false);
  const [newUserError, setNewUserError] = useState<string | null>(null);
  const [newUserSuccess, setNewUserSuccess] = useState(false);

  useEffect(() => {
    hasAdminUserRoleColumn().then(setRoleColumnExists);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchEmail.trim().toLowerCase();
    if (!trimmed) return;
    setLookup({ status: "loading" });
    setRoleError(null);
    setRoleSuccess(null);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      const res = await getAdminUserRoleByEmail(trimmed);
      if (!res.ok) {
        setLookup({ status: "not_found", email: trimmed, error: res.error ?? "Bulunamadı." });
        setNewUserEmail(trimmed);
        return;
      }
      const d = res.data!;
      setLookup({
        status: "found",
        email: d.email,
        authExists: d.authExists,
        panelRole: d.panelRole ?? null,
        panelRoleLabel: d.panelRoleLabel,
      });
      if (d.panelRole) setSelectedRole(d.panelRole);
      setNewUserEmail("");
      setNewUserPassword("");
    } catch {
      setLookup({ status: "not_found", email: trimmed, error: "Sorgu başarısız." });
    }
  }

  async function handleRoleSave(e: React.FormEvent) {
    e.preventDefault();
    if (lookup.status !== "found" || !lookup.authExists || roleColumnExists === false) return;
    setRoleError(null);
    setRoleSuccess(null);
    setRoleSaveLoading(true);
    try {
      const res = await updateAdminRoleByEmail(lookup.email, selectedRole);
      if (!res.ok) {
        setRoleError(res.error ?? "Rol güncellenemedi.");
        return;
      }
      setRoleSuccess(`Rol kaydedildi: ${ADMIN_ROLE_LABELS[selectedRole]}`);
      setLookup({
        ...lookup,
        panelRole: selectedRole,
        panelRoleLabel: ADMIN_ROLE_LABELS[selectedRole],
      });
      router.refresh();
    } finally {
      setRoleSaveLoading(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (lookup.status !== "found" || !lookup.authExists || !newPassword.trim() || newPassword.length < 6) return;
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordSaveLoading(true);
    try {
      const res = await resetUserPasswordByEmail(lookup.email, newPassword.trim());
      if (!res.ok) {
        setPasswordError(res.error ?? "Şifre güncellenemedi.");
        return;
      }
      setPasswordSuccess(true);
      setNewPassword("");
      router.refresh();
    } finally {
      setPasswordSaveLoading(false);
    }
  }

  async function handleAddToPanel(e: React.FormEvent) {
    e.preventDefault();
    if (lookup.status !== "found" || !lookup.authExists || roleColumnExists === false) return;
    setRoleError(null);
    setRoleSuccess(null);
    setRoleSaveLoading(true);
    try {
      const res = await addAdminUser(lookup.email, null, selectedRole);
      if (!res.ok) {
        setRoleError(res.error ?? "Panele eklenemedi.");
        return;
      }
      setRoleSuccess("Kullanıcı panele eklendi.");
      setLookup({
        ...lookup,
        panelRole: selectedRole,
        panelRoleLabel: ADMIN_ROLE_LABELS[selectedRole],
      });
      router.refresh();
    } finally {
      setRoleSaveLoading(false);
    }
  }

  async function handleCreateNewUser(e: React.FormEvent) {
    e.preventDefault();
    const email = newUserEmail.trim().toLowerCase();
    const password = newUserPassword.trim();
    if (!email) return;
    if (!password || password.length < 6) {
      setNewUserError("Şifre en az 6 karakter olmalı.");
      return;
    }
    setNewUserError(null);
    setNewUserSuccess(false);
    setNewUserLoading(true);
    try {
      const res = await addAdminUser(email, password, newUserRole);
      if (!res.ok) {
        setNewUserError(res.error ?? "Kullanıcı oluşturulamadı.");
        return;
      }
      setNewUserSuccess(true);
      setNewUserEmail("");
      setNewUserPassword("");
      setSearchEmail(email);
      router.refresh();
      setLookup({ status: "loading" });
      const refetch = await getAdminUserRoleByEmail(email);
      if (refetch.ok && refetch.data) {
        const d = refetch.data;
        setLookup({
          status: "found",
          email: d.email,
          authExists: d.authExists,
          panelRole: d.panelRole ?? null,
          panelRoleLabel: d.panelRoleLabel,
        });
        if (d.panelRole) setSelectedRole(d.panelRole);
      } else {
        setLookup({ status: "idle" });
      }
    } finally {
      setNewUserLoading(false);
    }
  }

  const canChangeRole = roleColumnExists === true;
  const showAddToPanel =
    lookup.status === "found" && lookup.authExists && !lookup.panelRole && canChangeRole;

  return (
    <div className="space-y-6">
      {roleColumnExists === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <code>admin_users.role</code> sütunu yok. Rol yönetimi için{" "}
          <code>supabase/migrations/055_admin_users_role.sql</code> çalıştırılmalı.
        </div>
      )}

      {/* Arama */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm font-medium text-siyah">E-posta ile ara</label>
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="ornek@email.com"
            className="w-full rounded border border-siyah/20 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={lookup.status === "loading"}
          className="rounded bg-siyah px-4 py-2 text-sm font-medium text-beyaz hover:bg-siyah/90 disabled:opacity-50"
        >
          {lookup.status === "loading" ? "Aranıyor…" : "Ara"}
        </button>
      </form>

      {/* Sonuç kartı */}
      {lookup.status === "found" && (
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-siyah">Kullanıcı: {lookup.email}</h2>
          <p className="mt-1 text-sm text-siyah/70">
            Auth: {lookup.authExists ? "Var" : "Yok"} · Panel: {lookup.panelRoleLabel}
          </p>

          {!lookup.authExists && (
            <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Bu e-posta ile hesap yok. Aşağıdan &quot;Yeni kullanıcı oluştur&quot; ile ekleyebilirsiniz.
            </p>
          )}

          {lookup.authExists && (
            <div className="mt-4 space-y-4">
              {/* Rol */}
              {canChangeRole && (
                <div className="rounded-lg border border-siyah/10 bg-siyah/[0.02] p-4">
                  <h3 className="text-sm font-medium text-siyah">Rol</h3>
                  {roleError && <p className="mt-1 text-sm text-red-700">{roleError}</p>}
                  {roleSuccess && <p className="mt-1 text-sm text-green-700">{roleSuccess}</p>}
                  <form onSubmit={showAddToPanel ? handleAddToPanel : handleRoleSave} className="mt-2 flex flex-wrap items-end gap-2">
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as AdminRole)}
                      className="rounded border border-siyah/20 px-3 py-2"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ADMIN_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={roleSaveLoading}
                      className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50"
                    >
                      {roleSaveLoading ? "…" : showAddToPanel ? "Panele ekle" : "Rolü kaydet"}
                    </button>
                  </form>
                </div>
              )}

              {/* Şifre */}
              <div className="rounded-lg border border-siyah/10 bg-siyah/[0.02] p-4">
                <h3 className="text-sm font-medium text-siyah">Şifre sıfırla</h3>
                {passwordError && <p className="mt-1 text-sm text-red-700">{passwordError}</p>}
                {passwordSuccess && <p className="mt-1 text-sm text-green-700">Şifre güncellendi.</p>}
                <form onSubmit={handlePasswordSave} className="mt-2 flex flex-wrap items-end gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifre (en az 6 karakter)"
                    minLength={6}
                    className="rounded border border-siyah/20 px-3 py-2"
                  />
                  <button
                    type="submit"
                    disabled={passwordSaveLoading || !newPassword.trim() || newPassword.length < 6}
                    className="rounded bg-siyah px-4 py-2 text-sm font-medium text-beyaz hover:bg-siyah/90 disabled:opacity-50"
                  >
                    {passwordSaveLoading ? "…" : "Şifreyi güncelle"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {lookup.status === "not_found" && (
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-4">
          <p className="text-siyah/80">
            <strong>{lookup.email}</strong> için kayıt bulunamadı. Yeni kullanıcı oluşturmak için aşağıdaki formu kullanın (e-posta önceden dolduruldu).
          </p>
        </div>
      )}

      {/* Yeni kullanıcı oluştur */}
      <div className="rounded-xl border border-siyah/10 bg-beyaz p-5">
        <h2 className="text-lg font-semibold text-siyah">Yeni kullanıcı oluştur</h2>
        <p className="mt-1 text-sm text-siyah/60">
          E-posta ve şifre ile yeni hesap açıp panele ekler. E-posta zaten varsa sadece panele rol atanır (şifre boş bırakılamaz).
        </p>
        {newUserError && <p className="mt-2 rounded bg-red-100 p-2 text-sm text-red-800">{newUserError}</p>}
        {newUserSuccess && <p className="mt-2 rounded bg-green-100 p-2 text-sm text-green-800">Kullanıcı oluşturuldu / panele eklendi.</p>}
        <form onSubmit={handleCreateNewUser} className="mt-4 flex flex-wrap gap-3">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="E-posta"
            required
            className="rounded border border-siyah/20 px-3 py-2"
          />
          <input
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            placeholder="Şifre (en az 6 karakter)"
            required
            minLength={6}
            className="rounded border border-siyah/20 px-3 py-2"
          />
          <select
            value={newUserRole}
            onChange={(e) => setNewUserRole(e.target.value as AdminRole)}
            className="rounded border border-siyah/20 px-3 py-2"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ADMIN_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={newUserLoading}
            className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90 disabled:opacity-50"
          >
            {newUserLoading ? "…" : "Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
