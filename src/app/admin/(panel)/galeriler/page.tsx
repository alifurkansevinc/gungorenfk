import { createClient } from "@/lib/supabase/server";

export default async function AdminGalerilerPage() {
  const supabase = await createClient();
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
            <div key={g.id} className="rounded border border-black/10 bg-beyaz px-4 py-3">
              <span className="font-medium">{g.title}</span>
              {g.event_date && <span className="ml-2 text-sm text-siyah/60">{new Date(g.event_date).toLocaleDateString("tr-TR")}</span>}
            </div>
          ))
        )}
      </div>
      <p className="mt-6 text-sm text-siyah/60">CRUD formu sonraki adımda eklenecek.</p>
    </div>
  );
}
