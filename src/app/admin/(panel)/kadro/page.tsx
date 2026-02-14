import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { KadroSilButton } from "./KadroSilButton";

export default async function AdminKadroPage() {
  const supabase = await getAdminSupabase();
  const { data: squad } = await supabase
    .from("squad")
    .select("id, name, shirt_number, position, position_category, sort_order, is_active, is_captain, season")
    .order("season", { ascending: false, nullsFirst: false })
    .order("sort_order");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Kadro</h1>
          <p className="mt-1 text-siyah/70">Oyuncu ekle/düzenle. Forma no, pozisyon ve kaptan bilgisi.</p>
        </div>
        <Link href="/admin/kadro/yeni" className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark">
          + Yeni oyuncu
        </Link>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">#</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Ad Soyad</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sezon</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Pozisyon</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Sıra</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!squad || squad.length === 0) ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-siyah/60">Henüz oyuncu yok. &quot;Yeni oyuncu&quot; ile ekleyin.</td></tr>
            ) : (
              squad.map((p) => (
                <tr key={p.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 font-bold text-bordo">{p.shirt_number ?? "—"}</td>
                  <td className="px-4 py-3 font-medium text-siyah">
                    {p.name}
                    {p.is_captain && <span className="ml-1 text-xs text-siyah/60">(Kaptan)</span>}
                  </td>
                  <td className="px-4 py-3 text-siyah/70">{p.season ?? "—"}</td>
                  <td className="px-4 py-3 text-siyah/80">{p.position ?? p.position_category ?? "—"}</td>
                  <td className="px-4 py-3 text-siyah/80">{p.sort_order}</td>
                  <td className="px-4 py-3">{p.is_active ? <span className="text-green-600">Aktif</span> : <span className="text-siyah/50">Pasif</span>}</td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link href={`/admin/kadro/duzenle/${p.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
                    <KadroSilButton id={p.id} name={p.name} />
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
