import { getAdminSupabase } from "../../actions";

export default async function AdminHaberlerPage() {
  const supabase = await getAdminSupabase();
  const { data: news } = await supabase.from("news").select("id, title, slug, published_at").order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Haberler</h1>
      <p className="mt-1 text-siyah/70">Haber ekle/düzenle.</p>
      <div className="mt-6 space-y-2">
        {(!news || news.length === 0) ? (
          <p className="text-siyah/60">Henüz haber yok.</p>
        ) : (
          news.map((n) => (
            <div key={n.id} className="rounded border border-black/10 bg-beyaz px-4 py-3">
              <span className="font-medium">{n.title}</span>
              {n.published_at && <span className="ml-2 text-sm text-siyah/60">{new Date(n.published_at).toLocaleDateString("tr-TR")}</span>}
            </div>
          ))
        )}
      </div>
      <p className="mt-6 text-sm text-siyah/60">CRUD formu sonraki adımda eklenecek.</p>
    </div>
  );
}
