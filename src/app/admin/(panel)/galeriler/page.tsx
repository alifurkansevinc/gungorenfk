import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { GaleriSilButton } from "./GaleriSilButton";

export default async function AdminGalerilerPage() {
  const supabase = await getAdminSupabase();
  const { data: galleries } = await supabase.from("galleries").select("id, title, slug, event_date").order("event_date", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Galeriler</h1>
          <p className="mt-1 text-siyah/70">Galeri ve fotoğraf ekle/düzenle.</p>
        </div>
        <Link href="/admin/galeriler/yeni" className="rounded bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo-dark min-touch">Yeni galeri</Link>
      </div>
      <div className="mt-6 space-y-2">
        {(!galleries || galleries.length === 0) ? (
          <p className="text-siyah/60">Henüz galeri yok. &quot;Yeni galeri&quot; ile ekleyin.</p>
        ) : (
          galleries.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-black/10 bg-beyaz px-4 py-3">
              <div>
                <span className="font-medium">{g.title}</span>
                {g.event_date && <span className="ml-2 text-sm text-siyah/60">{new Date(g.event_date).toLocaleDateString("tr-TR")}</span>}
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/admin/galeriler/duzenle/${g.id}`} className="text-sm text-siyah/80 hover:underline">Düzenle</Link>
                <Link href={`/galeri/${g.slug}`} target="_blank" className="text-sm text-bordo hover:underline">Görüntüle</Link>
                <GaleriSilButton id={g.id} title={g.title} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
