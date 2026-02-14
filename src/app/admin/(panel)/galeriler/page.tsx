import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { GaleriSilButton } from "./GaleriSilButton";

export default async function AdminGalerilerPage() {
  const supabase = await getAdminSupabase();
  const { data: galleries } = await supabase.from("galleries").select("id, title, slug, event_date").order("event_date", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Galeriler</h1>
      <p className="mt-1 text-siyah/70">Galeri ve fotoğraf ekle/düzenle.</p>
      <div className="mt-6 space-y-2">
        {(!galleries || galleries.length === 0) ? (
          <p className="text-siyah/60">Henüz galeri yok.</p>
        ) : (
          galleries.map((g) => (
            <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-black/10 bg-beyaz px-4 py-3">
              <div>
                <span className="font-medium">{g.title}</span>
                {g.event_date && <span className="ml-2 text-sm text-siyah/60">{new Date(g.event_date).toLocaleDateString("tr-TR")}</span>}
              </div>
              <div className="flex gap-3">
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
