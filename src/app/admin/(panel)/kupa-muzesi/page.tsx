import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { HakkımızdaForm } from "./HakkımızdaForm";
import { KupaSilButton } from "./KupaSilButton";

export default async function AdminKupaMuzesiPage() {
  const supabase = await getAdminSupabase();
  const [{ data: aboutRow }, { data: trophies }] = await Promise.all([
    supabase.from("club_about").select("content").eq("id", 1).single(),
    supabase.from("club_trophies").select("id, name, year, image_url, sort_order, is_active").order("sort_order"),
  ]);
  const aboutContent = (aboutRow as { content?: string } | null)?.content ?? "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Hakkımızda & Tarihi ve Kupa Müzesi</h1>
          <p className="mt-1 text-siyah/70">Kulübümüz sayfasında Hakkımızda metni ve kupa müzesi tek bölümde gösterilir.</p>
        </div>
        <Link href="/admin/kupa-muzesi/yeni" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
          + Yeni kupa
        </Link>
      </div>

      <div className="mt-8 rounded-xl border border-siyah/10 bg-siyah/[0.02] p-6">
        <h2 className="text-lg font-semibold text-siyah">Hakkımızda açıklama metni</h2>
        <HakkımızdaForm initialContent={aboutContent} />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-siyah">Kupalar</h2>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sıra</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Kupa</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Yıl</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!trophies || trophies.length === 0) ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-siyah/60">Henüz kupa yok. &quot;Yeni kupa&quot; ile ekleyin.</td></tr>
            ) : (
              trophies.map((t) => (
                <tr key={t.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 text-siyah/80">{t.sort_order}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {t.image_url && (
                        <img src={t.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      )}
                      <span className="font-medium text-siyah">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-siyah/80">{t.year}</td>
                  <td className="px-4 py-3">{t.is_active ? <span className="text-green-600">Aktif</span> : <span className="text-siyah/50">Pasif</span>}</td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/admin/kupa-muzesi/duzenle/${t.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
                    <KupaSilButton id={t.id} name={t.name} />
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
