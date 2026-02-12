import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { TECHNICAL_STAFF_ROLE_LABELS } from "@/lib/board-labels";

export default async function AdminTeknikHeyetPage() {
  const supabase = await getAdminSupabase();
  const { data: members } = await supabase
    .from("technical_staff")
    .select("id, name, role_slug, sort_order, is_active")
    .order("sort_order");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Teknik Heyet</h1>
          <p className="mt-1 text-siyah/70">Teknik direktör, antrenörler ve kulüp yönetimi. Sitede Kulübümüz → Teknik Heyet sayfasında gösterilir.</p>
        </div>
        <Link href="/admin/teknik-heyet/yeni" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
          + Yeni üye
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sıra</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Ad Soyad</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Görev</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!members || members.length === 0) ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-siyah/60">Henüz üye yok. &quot;Yeni üye&quot; ile ekleyin.</td></tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 text-siyah/80">{m.sort_order}</td>
                  <td className="px-4 py-3 font-medium text-siyah">{m.name}</td>
                  <td className="px-4 py-3 text-siyah/70">{TECHNICAL_STAFF_ROLE_LABELS[m.role_slug] ?? m.role_slug}</td>
                  <td className="px-4 py-3">{m.is_active ? <span className="text-green-600">Aktif</span> : <span className="text-siyah/50">Pasif</span>}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/teknik-heyet/duzenle/${m.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
