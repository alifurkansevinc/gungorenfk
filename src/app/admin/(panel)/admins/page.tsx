import { getAdminSupabase } from "../../actions";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { AdminKullaniciForm } from "./AdminKullaniciForm";

export default async function AdminAdminsPage() {
  const supabase = await getAdminSupabase();
  const { data: adminRows } = await supabase.from("admin_users").select("id, user_id").order("created_at", { ascending: false });

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
      <h1 className="text-2xl font-bold text-siyah">Admin kullanıcıları</h1>
      <p className="mt-1 text-siyah/70">Admin panele giriş yapabilecek hesaplar. Yeni admin eklemek için e-posta girin (o e-posta ile Supabase Auth’da kayıt olmuş olmalı).</p>

      <AdminKullaniciForm />

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-siyah">Mevcut adminler</h2>
        {(!adminRows || adminRows.length === 0) ? (
          <p className="mt-2 text-siyah/60">Henüz admin yok. İlk admini aşağıdaki “İlk admin” adımlarıyla veya SQL ile ekleyin.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {adminRows.map((row) => (
              <li key={row.id} className="flex items-center gap-2 rounded-lg border border-siyah/10 bg-beyaz px-4 py-2">
                <span className="font-mono text-sm text-siyah/70">{row.user_id}</span>
                {emails[row.user_id] && <span className="text-siyah">({emails[row.user_id]})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <h3 className="font-semibold">İlk admin nasıl eklenir?</h3>
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Supabase Dashboard → Authentication → Users → “Add user” ile bir kullanıcı oluşturun (e-posta + şifre).</li>
          <li>O kullanıcının UUID’sini kopyalayın.</li>
          <li>SQL Editor’da çalıştırın: <code className="rounded bg-amber-100 px-1">SELECT add_first_admin('BURAYA-UUID-YAPIŞTIR');</code></li>
          <li>Ardından /admin/giris sayfasından bu e-posta ve şifre ile giriş yapın.</li>
        </ol>
        <p className="mt-3 text-amber-800">Migration 025 (add_first_admin) daha önce çalıştırılmış olmalı.</p>
      </div>
    </div>
  );
}
