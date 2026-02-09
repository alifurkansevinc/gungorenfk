import { createClient } from "@/lib/supabase/server";

export default async function AdminKadroPage() {
  const supabase = await createClient();
  const { data: squad } = await supabase.from("squad").select("id, name, shirt_number, position").order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Kadro</h1>
      <p className="mt-1 text-siyah/70">Oyuncu ekle/düzenle.</p>
      <div className="mt-6 space-y-2">
        {(!squad || squad.length === 0) ? (
          <p className="text-siyah/60">Henüz oyuncu yok.</p>
        ) : (
          squad.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded border border-black/10 bg-beyaz px-4 py-3">
              {p.shirt_number != null && <span className="font-bold text-bordo">#{p.shirt_number}</span>}
              <span className="font-medium">{p.name}</span>
              {p.position && <span className="text-siyah/70">{p.position}</span>}
            </div>
          ))
        )}
      </div>
      <p className="mt-6 text-sm text-siyah/60">CRUD formu sonraki adımda eklenecek.</p>
    </div>
  );
}
