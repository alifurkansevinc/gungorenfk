import { getAdminSupabase } from "../../actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { AdminKullaniciForm } from "./AdminKullaniciForm";
import { SifreSifirlaForm } from "./SifreSifirlaForm";
import { ADMIN_ROLE_LABELS } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";

export default async function AdminAdminsPage() {
  const supabase = await getAdminSupabase();
  const { data: adminRows } = await supabase
    .from("admin_users")
    .select("id, user_id, role")
    .order("created_at", { ascending: false });

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
        Admin panele giriş yapabilecek hesaplar. Yeni kullanıcı eklerken e-posta, şifre ve rol belirleyin; sadece admin rolü bu sayfayı görür.
      </p>

      <AdminKullaniciForm />

      <SifreSifirlaForm />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-siyah">Mevcut kullanıcılar</h2>
        {(!adminRows || adminRows.length === 0) ? (
        <p className="mt-2 text-siyah/60">Henüz kullanıcı yok. Yukarıdaki form ile ekleyin.</p>
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
                  {ADMIN_ROLE_LABELS[(row.role ?? "admin") as AdminRole]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h3 className="font-semibold">İlk admin nasıl eklenir?</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Yukarıdaki formdan e-posta, şifre ve rol "Admin" seçerek ilk admini oluşturabilirsiniz.</li>
          <li>Veya Supabase Dashboard → Authentication → Users üzerinden kullanıcı oluşturup SQL ile <code className="rounded bg-amber-100 px-1">INSERT INTO admin_users (user_id, role) VALUES ('UUID', 'admin');</code> ekleyin.</li>
        </ol>
      </div>
    </div>
  );
}
