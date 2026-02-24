import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";

export default async function AdminAvantajModulleriPage() {
  const supabase = await getAdminSupabase();
  const { data: modules } = await supabase
    .from("benefit_modules")
    .select("id, name, slug, value_type, unit_label, sort_order")
    .order("sort_order");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Avantaj modülleri</h1>
          <p className="mt-1 text-siyah/70">Rütbelere atanabilen hak tipleri (indirim %, hediye adedi, daimi koltuk vb.). Rozet düzenlemede her rütbeye oran ve hak atayabilirsiniz.</p>
        </div>
        <Link href="/admin/avantaj-modulleri/yeni" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90">
          Yeni modül
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Ad</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Slug</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Değer tipi</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Birim</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sıra</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!modules || modules.length === 0) ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-siyah/60">Henüz modül yok. &quot;Yeni modül&quot; ile ekleyin.</td></tr>
            ) : (
              modules.map((m) => (
                <tr key={m.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 font-medium text-siyah">{m.name}</td>
                  <td className="px-4 py-3 text-siyah/70">{m.slug}</td>
                  <td className="px-4 py-3 text-siyah/80">{m.value_type === "percent" ? "Oran (%)" : m.value_type === "boolean" ? "Var/Yok" : "Sayı"}</td>
                  <td className="px-4 py-3 text-siyah/80">{m.unit_label || "—"}</td>
                  <td className="px-4 py-3 text-siyah/80">{m.sort_order}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/avantaj-modulleri/duzenle/${m.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
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
