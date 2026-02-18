import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { TransferlerTabs } from "./TransferlerTabs";

export const metadata = {
  title: "Transferler | Güngören FK",
  description: "Güngören FK transfer haberleri ve oyuncu istatistikleri.",
};

const PLACEHOLDER_PLAYER = DEMO_IMAGES.playerCard;

export default async function TransferlerPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "outgoing" ? "outgoing" : "incoming";

  const supabase = await createClient();
  const { data: transfers } = await supabase
    .from("transfers")
    .select("id, player_name, player_image_url, from_team_name, from_team_league, to_team_name, to_team_league, transfer_date, direction")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const list = (transfers ?? []).filter((t) => (t.direction ?? "incoming") === activeTab);
  const transferIds = list.map((t) => t.id);
  const statsMap: Record<string, { season_label: string; matches_played: number; goals: number; assists: number }[]> = {};
  if (transferIds.length > 0) {
    const { data: stats } = await supabase
      .from("transfer_season_stats")
      .select("transfer_id, season_label, matches_played, goals, assists")
      .in("transfer_id", transferIds)
      .order("sort_order", { ascending: true })
      .order("season_label", { ascending: false });
    for (const s of stats ?? []) {
      const id = (s as { transfer_id: string }).transfer_id;
      if (!statsMap[id]) statsMap[id] = [];
      statsMap[id].push({
        season_label: s.season_label,
        matches_played: s.matches_played ?? 0,
        goals: s.goals ?? 0,
        assists: s.assists ?? 0,
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="border-b border-siyah/10 bg-siyah text-beyaz">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <nav className="text-sm text-beyaz/70">
            <Link href="/" className="hover:text-beyaz transition-colors">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz font-medium">Transferler</span>
          </nav>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Transferler</h1>
          <p className="mt-2 max-w-xl text-beyaz/80">
            Kadromuza katılan ve ayrılan oyuncular; sezonluk performans istatistikleri.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <TransferlerTabs activeTab={activeTab} />

        {list.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-siyah/15 bg-beyaz p-12 text-center text-siyah/60">
            <p className="font-medium">
              {activeTab === "incoming" ? "Henüz gelen transfer kaydı yok." : "Henüz giden transfer kaydı yok."}
            </p>
            <p className="mt-1 text-sm">Yakında burada listelenecektir.</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-10">
            {list.map((t) => {
              const stats = statsMap[t.id] ?? [];
              const isIncoming = (t.direction ?? "incoming") === "incoming";
              return (
                <li key={t.id} className="overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-lg shadow-siyah/5">
                  {/* Gelenler: [Geldiği takım] | [Oyuncu]. Gidenler: [Oyuncu] | [Gittiği takım] */}
                  <div className={`grid min-h-[200px] gap-0 sm:min-h-[240px] ${isIncoming ? "grid-cols-[1fr_auto]" : "grid-cols-[auto_1fr]"}`}>
                    {isIncoming ? (
                      <>
                        <div className="flex flex-col justify-center border-r border-siyah/10 bg-gradient-to-b from-siyah/5 to-transparent px-6 py-6 text-center sm:px-10">
                          <p className="text-xs font-semibold uppercase tracking-wider text-bordo">Geldiği takım</p>
                          <p className="font-display mt-2 text-lg font-bold text-siyah sm:text-xl">{t.from_team_name}</p>
                          {t.from_team_league && (
                            <p className="mt-1 text-sm text-siyah/60">{t.from_team_league}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-center justify-center px-6 py-6 sm:px-10">
                          <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-bordo/30 shadow-xl sm:h-28 sm:w-28">
                            <Image
                              src={t.player_image_url || PLACEHOLDER_PLAYER}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="112px"
                              unoptimized={!t.player_image_url?.startsWith("https://")}
                            />
                          </div>
                          <p className="font-display mt-3 text-center text-lg font-bold text-siyah sm:text-xl">{t.player_name}</p>
                          {t.transfer_date && (
                            <p className="mt-1 text-xs text-siyah/50">{new Date(t.transfer_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-col items-center justify-center border-r border-siyah/10 px-6 py-6 sm:px-10">
                          <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-bordo/30 shadow-xl sm:h-28 sm:w-28">
                            <Image
                              src={t.player_image_url || PLACEHOLDER_PLAYER}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="112px"
                              unoptimized={!t.player_image_url?.startsWith("https://")}
                            />
                          </div>
                          <p className="font-display mt-3 text-center text-lg font-bold text-siyah sm:text-xl">{t.player_name}</p>
                          {t.transfer_date && (
                            <p className="mt-1 text-xs text-siyah/50">{new Date(t.transfer_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                          )}
                        </div>
                        <div className="flex flex-col justify-center bg-gradient-to-b from-bordo/5 to-transparent px-6 py-6 text-center sm:px-10">
                          <p className="text-xs font-semibold uppercase tracking-wider text-bordo">Gittiği takım</p>
                          <p className="font-display mt-2 text-lg font-bold text-siyah sm:text-xl">{t.to_team_name}</p>
                          {t.to_team_league && (
                            <p className="mt-1 text-sm text-siyah/60">{t.to_team_league}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {stats.length > 0 && (
                    <div className="border-t border-siyah/10 bg-siyah/5 px-4 py-4 sm:px-6">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-siyah/50">Sezonluk istatistikler</p>
                      <div className="overflow-x-auto rounded-xl border border-siyah/10 bg-beyaz">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-siyah/10 bg-siyah/5">
                              <th className="px-4 py-3 text-left font-semibold text-siyah">Sezon</th>
                              <th className="px-4 py-3 text-right font-semibold text-siyah">Maç</th>
                              <th className="px-4 py-3 text-right font-semibold text-siyah">Gol</th>
                              <th className="px-4 py-3 text-right font-semibold text-siyah">Asist</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.map((row, i) => (
                              <tr key={i} className="border-b border-siyah/5 last:border-0">
                                <td className="px-4 py-2.5 font-medium text-siyah">{row.season_label}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-siyah/80">{row.matches_played}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-bordo font-semibold">{row.goals}</td>
                                <td className="px-4 py-2.5 text-right tabular-nums text-siyah/80">{row.assists}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
