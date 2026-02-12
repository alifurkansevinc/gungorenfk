import { getAdminSupabase } from "../../actions";
import Link from "next/link";

export default async function AdminMaclarPage() {
  const supabase = await getAdminSupabase();
  const { data: matches } = await supabase.from("matches").select("id, opponent_name, match_date, goals_for, goals_against, status").order("match_date", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Maçlar</h1>
      <p className="mt-1 text-siyah/70">Maç ekle/düzenle. Skorlar şimdilik manuel; Mackolik entegrasyonu ileride eklenebilir.</p>
      <div className="mt-6 space-y-2">
        {(!matches || matches.length === 0) ? (
          <p className="text-siyah/60">Henüz maç yok.</p>
        ) : (
          matches.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded border border-black/10 bg-beyaz px-4 py-3">
              <span>{m.opponent_name} · {new Date(m.match_date).toLocaleDateString("tr-TR")}</span>
              {m.status === "finished" && m.goals_for != null && <span className="font-semibold text-bordo">{m.goals_for} - {m.goals_against}</span>}
            </div>
          ))
        )}
      </div>
      <p className="mt-6 text-sm text-siyah/60">CRUD formu sonraki adımda eklenecek. Supabase üzerinden de ekleyebilirsiniz.</p>
    </div>
  );
}
