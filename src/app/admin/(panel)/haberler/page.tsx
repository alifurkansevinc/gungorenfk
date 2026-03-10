import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { HaberSilButton } from "./HaberSilButton";
import { YeniEtkinlikButton } from "./YeniEtkinlikButton";
import { EtkinlikPasifToggle } from "./EtkinlikPasifToggle";

export default async function AdminHaberlerPage() {
  const supabase = await getAdminSupabase();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, published_at, created_at, is_ticketed, is_hidden")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Etkinlikler</h1>
          <p className="mt-1 text-siyah/70">Etkinlik ekle, düzenle veya sil. Pasif yapılan etkinlik sitede gösterilmez.</p>
        </div>
        <YeniEtkinlikButton />
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Başlık</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Slug</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Bilet</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Yayın</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Pasif</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!news || news.length === 0) ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-siyah/60">Henüz etkinlik yok. &quot;Yeni etkinlik&quot; ile ekleyin.</td></tr>
            ) : (
              news.map((n) => (
                <tr key={n.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 font-medium text-siyah">{n.title}</td>
                  <td className="px-4 py-3 text-siyah/70">{n.slug}</td>
                  <td className="px-4 py-3">{(n as { is_ticketed?: boolean }).is_ticketed ? <span className="rounded bg-bordo/15 px-2 py-0.5 text-xs font-semibold text-bordo">Biletli</span> : "—"}</td>
                  <td className="px-4 py-3 text-siyah/80">{n.published_at ? new Date(n.published_at).toLocaleDateString("tr-TR") : "—"}</td>
                  <td className="px-4 py-3">
                    <EtkinlikPasifToggle id={n.id} isHidden={!!(n as { is_hidden?: boolean }).is_hidden} />
                  </td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/admin/haberler/duzenle/${n.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
                    <HaberSilButton id={n.id} title={n.title} />
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
