import { getAdminSupabase } from "../../actions";
import { hasAdminUserRoleColumn } from "../../actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { KullaniciYonetimi } from "./KullaniciYonetimi";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";

export default async function AdminAdminsPage() {
  const supabase = await getAdminSupabase();
  const hasRoleColumn = await hasAdminUserRoleColumn();
  const { data: adminRowsRaw } = hasRoleColumn
    ? await supabase.from("admin_users").select("id, user_id, role, created_at")
    : await supabase.from("admin_users").select("id, user_id, created_at");
  const adminRows = [...(adminRowsRaw ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  let emails: Record<string, string> = {};
  if (adminRows && adminRows.length > 0) {
    const service = createServiceRoleClient();
    const { data: listData } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = listData?.users ?? [];
    for (const row of adminRows) {
      const u = users.find((x) => x.id === row.user_id);
      if (u?.email) emails[row.user_id] = u.email;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Panel kullanıcıları</h1>
      <p className="mt-1 text-siyah/70">
        E-posta ile ara, rol değiştir, şifre sıfırla veya yeni kullanıcı oluştur. Tek ekrandan yönetim.
      </p>

      <div className="mt-6">
        <KullaniciYonetimi />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-siyah">Mevcut panel kullanıcıları</h2>
        {(!adminRows || adminRows.length === 0) ? (
          <p className="mt-2 text-siyah/60">Henüz kullanıcı yok. Yukarıdan ekleyin.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {adminRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-siyah/10 bg-beyaz px-4 py-2"
              >
                <span className="font-mono text-sm text-siyah/70">{row.user_id}</span>
                {emails[row.user_id] && <span className="text-siyah">{emails[row.user_id]}</span>}
                <span className="rounded bg-siyah/10 px-2 py-0.5 text-sm font-medium text-siyah">
                  {hasRoleColumn
                    ? ADMIN_ROLE_LABELS[((row as { role?: AdminRole }).role ?? "admin") as AdminRole]
                    : "Admin"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
