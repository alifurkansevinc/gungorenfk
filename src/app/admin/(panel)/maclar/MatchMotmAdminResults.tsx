import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";

function formatTr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Bu maç için taraftar MOTM oylaması: adaylar + oy sayıları (admin). */
export async function MatchMotmAdminResults({ matchId }: { matchId: string }) {
  const supabase = await getAdminSupabase();
  const [{ data: matchRow }, { data: cands }, { data: votes }] = await Promise.all([
    supabase
      .from("matches")
      .select("motm_vote_starts_at, motm_vote_ends_at")
      .eq("id", matchId)
      .maybeSingle(),
    supabase.from("match_motm_candidates").select("squad_member_id").eq("match_id", matchId),
    supabase.from("match_motm_votes").select("squad_member_id").eq("match_id", matchId),
  ]);

  const candidateIds = [...new Set((cands ?? []).map((r) => (r as { squad_member_id: string }).squad_member_id))];
  if (candidateIds.length === 0) {
    return (
      <section className="mb-8 rounded-xl border border-siyah/10 bg-siyah/[0.02] p-4">
        <h2 className="text-sm font-semibold text-siyah">Taraftar oylaması (Maçın oyuncusu)</h2>
        <p className="mt-1 text-xs text-siyah/60">Bu maç için oylama adayı tanımlanmamış.</p>
      </section>
    );
  }

  const tally = new Map<string, number>();
  for (const v of votes ?? []) {
    const sid = (v as { squad_member_id: string }).squad_member_id;
    tally.set(sid, (tally.get(sid) ?? 0) + 1);
  }

  const idsForNames = [...new Set([...candidateIds, ...tally.keys()])];
  const { data: squadRows } = await supabase
    .from("squad")
    .select("id, name, shirt_number")
    .in("id", idsForNames);
  const nameById = new Map((squadRows ?? []).map((r) => [r.id, r as { id: string; name: string; shirt_number: number | null }]));

  const rows = candidateIds
    .map((id) => ({
      id,
      name: nameById.get(id)?.name ?? "Bilinmeyen",
      num: nameById.get(id)?.shirt_number ?? null,
      votes: tally.get(id) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, "tr"));

  const totalVotes = (votes ?? []).length;
  const m = matchRow as { motm_vote_starts_at?: string | null; motm_vote_ends_at?: string | null } | null;

  return (
    <section className="mb-8 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
      <h2 className="text-sm font-semibold text-siyah">Taraftar oylaması — sonuç özeti</h2>
      <p className="mt-1 text-xs text-siyah/65">
        Oylama penceresi: <span className="font-medium">{formatTr(m?.motm_vote_starts_at)}</span> —{" "}
        <span className="font-medium">{formatTr(m?.motm_vote_ends_at)}</span>
        {totalVotes > 0 ? (
          <>
            {" "}
            · Toplam <strong>{totalVotes}</strong> oy
          </>
        ) : (
          <> · Henüz oy yok</>
        )}
      </p>
      <div className="mt-3 overflow-x-auto rounded-lg border border-siyah/10 bg-beyaz">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-3 py-2 font-medium text-siyah/70">Oyuncu</th>
              <th className="px-3 py-2 font-medium text-siyah/70 text-right">Oy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-siyah/5">
                <td className="px-3 py-2">
                  {r.num != null ? <span className="font-semibold text-bordo">{r.num}. </span> : null}
                  {r.name}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.votes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-siyah/55">
        Haftanın oyuncusu duyurusunu{" "}
        <Link href="/admin/maclar/haftanin-oyuncusu" className="font-medium text-bordo underline">
          Haftanın oyuncusu
        </Link>{" "}
        sayfasından kaydedin; kazananı buradaki sonuca göre seçebilirsiniz.
      </p>
    </section>
  );
}
