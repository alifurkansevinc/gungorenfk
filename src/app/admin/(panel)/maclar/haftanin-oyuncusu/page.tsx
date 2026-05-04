import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";
import { submitWeekPlayerAwardForm } from "@/app/actions/admin";

export default async function HaftaninOyuncusuAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; err?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await getAdminSupabase();
  const [{ data: awards }, { data: matches }, { data: squad }] = await Promise.all([
    supabase
      .from("week_player_awards")
      .select("id, season, week_number, match_id, squad_id, created_at")
      .order("season", { ascending: false })
      .order("week_number", { ascending: false })
      .limit(40),
    supabase
      .from("matches")
      .select("id, opponent_name, match_date, season, home_away")
      .eq("status", "finished")
      .order("match_date", { ascending: false })
      .limit(50),
    supabase.from("squad").select("id, name, shirt_number").eq("is_active", true).order("sort_order"),
  ]);

  const squadIds = [...new Set((awards ?? []).map((a) => (a as { squad_id: string }).squad_id))];
  const { data: squadForAwards } =
    squadIds.length > 0
      ? await supabase.from("squad").select("id, name, shirt_number").in("id", squadIds)
      : { data: [] as { id: string; name: string; shirt_number: number | null }[] };
  const squadAwardMap = new Map((squadForAwards ?? []).map((r) => [r.id, r]));

  const seasons = Array.from(
    new Set([
      ...((matches ?? []).map((m) => (m as { season: string | null }).season).filter(Boolean) as string[]),
      ...((awards ?? []).map((a) => (a as { season: string }).season)),
      "2025-26",
      "2026-27",
      "2027-28",
    ])
  ).sort();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/admin/maclar" className="text-sm text-bordo hover:underline">
          ← Maç listesi
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-siyah">Haftanın oyuncusu</h1>
        <p className="mt-1 text-siyah/70">
          Oylama bittikten sonra duyurulan oyuncuyu kaydedin; kayıt ana sayfada kalıcı listelenir. Maç seçerseniz{" "}
          <strong>maçın resmi MOTM</strong> alanı da bu oyuncuya güncellenir (favori barem sayımı).
        </p>
        <p className="mt-2 text-sm">
          <Link href="/admin/maclar/motm-cekilis" className="font-medium text-bordo hover:underline">
            MOTM çekiliş havuzu
          </Link>
          <span className="text-siyah/70">
            {" "}
            — oylamaya katılan üyelerden havuz oluşturup talihli seçmek için.
          </span>
        </p>
        <p className="mt-2 rounded-lg border border-siyah/10 bg-siyah/[0.03] px-3 py-2 text-sm text-siyah/80">
          <strong className="text-siyah">Taraftar oy sayıları nerede?</strong>{" "}
          <span className="text-siyah/70">
            Her maç için <strong>Admin → Maçlar → Düzenle</strong> sayfasının üstünde &quot;Taraftar oylaması — sonuç özeti&quot;
            tablosunda aday başına oy ve toplam oy görünür.
          </span>
        </p>
      </div>

      {sp.ok && (
        <p className="rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-900">Kayıt oluşturuldu.</p>
      )}
      {sp.err && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-900">{decodeURIComponent(sp.err)}</p>
      )}

      <form action={submitWeekPlayerAwardForm} className="space-y-4 rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-siyah">Yeni kayıt</h2>
        <div>
          <label className="block text-sm font-medium text-siyah">Sezon *</label>
          <select name="season" required className="mt-1 w-full max-w-md rounded border border-siyah/20 px-3 py-2">
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Hafta (1–53) *</label>
          <input name="week_number" type="number" min={1} max={53} required className="mt-1 w-full max-w-xs rounded border border-siyah/20 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Maç (MOTM güncellemesi için; opsiyonel)</label>
          <select name="match_id" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm">
            <option value="">— Maç seçme —</option>
            {(matches ?? []).map((m) => {
              const row = m as { id: string; opponent_name: string; match_date: string; season: string | null; home_away: string };
              const label =
                row.home_away === "home"
                  ? `Güngören FK — ${row.opponent_name}`
                  : `${row.opponent_name} — Güngören FK`;
              return (
                <option key={row.id} value={row.id}>
                  {row.match_date} · {label}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-siyah">Oyuncu *</label>
          <select name="squad_id" required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2">
            <option value="">— Seçin —</option>
            {(squad ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.shirt_number != null ? `${p.shirt_number}. ` : ""}
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-lg bg-bordo px-5 py-2.5 font-semibold text-beyaz hover:bg-bordo-dark">
          Kaydet
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-siyah">Kayıtlı haftalar</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-siyah/10">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-siyah/5">
              <tr>
                <th className="px-4 py-2 font-medium text-siyah/70">Sezon</th>
                <th className="px-4 py-2 font-medium text-siyah/70">Hafta</th>
                <th className="px-4 py-2 font-medium text-siyah/70">Oyuncu</th>
              </tr>
            </thead>
            <tbody>
              {(!awards || awards.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-siyah/50">
                    Henüz kayıt yok.
                  </td>
                </tr>
              )}
              {(awards ?? []).map((a) => {
                const row = a as { id: string; season: string; week_number: number; squad_id: string };
                const p = squadAwardMap.get(row.squad_id);
                return (
                  <tr key={row.id} className="border-t border-siyah/5">
                    <td className="px-4 py-2">{row.season}</td>
                    <td className="px-4 py-2 font-semibold">{row.week_number}</td>
                    <td className="px-4 py-2">
                      {p ? (
                        <>
                          {p.shirt_number != null ? `${p.shirt_number}. ` : ""}
                          {p.name}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
