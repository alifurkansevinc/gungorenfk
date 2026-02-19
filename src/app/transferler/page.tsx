import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { TransferlerTabs } from "./TransferlerTabs";

export const metadata = {
  title: "Transferler | Güngören FK",
  description: "Güngören FK transfer haberleri ve oyuncu istatistikleri.",
};

const PLACEHOLDER_PLAYER = DEMO_IMAGES.portrait;

export default async function TransferlerPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "outgoing" ? "outgoing" : "incoming";

  const supabase = await createClient();
  const { data: transfers } = await supabase
    .from("transfers")
    .select("id, player_name, player_image_url, position, age, from_team_name, from_team_league, to_team_name, to_team_league, transfer_date, direction")
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
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((t) => {
              const stats = statsMap[t.id] ?? [];
              const isIncoming = (t.direction ?? "incoming") === "incoming";
              const otherTeamName = isIncoming ? t.from_team_name : t.to_team_name;
              const otherTeamLeague = isIncoming ? t.from_team_league : t.to_team_league;
              const teamLabel = isIncoming ? "Geldiği takım" : "Gittiği takım";
              return (
                <li key={t.id} className="flex flex-col overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-md shadow-siyah/5">
                  {/* Dik kart: kadro gibi portre resim üstte, bilgi altta */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-siyah">
                    <Image
                      src={t.player_image_url || PLACEHOLDER_PLAYER}
                      alt=""
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-siyah/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-beyaz">
                      <p className="text-xs font-semibold uppercase tracking-wider text-bordo">{teamLabel}</p>
                      <p className="mt-0.5 truncate text-sm font-medium text-beyaz/90">{otherTeamName}</p>
                      {otherTeamLeague && <p className="truncate text-xs text-beyaz/70">{otherTeamLeague}</p>}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col border-t border-siyah/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-bordo">Oyuncu</p>
                    <h2 className="font-display mt-0.5 text-lg font-bold text-siyah">{t.player_name}</h2>
                    {(t.position || t.age != null) && (
                      <p className="mt-1 text-sm text-siyah/60">
                        {[t.position, t.age != null ? `${t.age} yaş` : null].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {t.transfer_date && (
                      <p className="mt-1 text-xs text-siyah/50">
                        {new Date(t.transfer_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    )}
                    {stats.length > 0 && (
                      <div className="mt-3 border-t border-siyah/10 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-siyah/50">İstatistikler</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-siyah/10 text-siyah/70">
                                <th className="py-1.5 text-left font-medium">Sezon</th>
                                <th className="py-1.5 text-right">M</th>
                                <th className="py-1.5 text-right text-bordo font-semibold">G</th>
                                <th className="py-1.5 text-right">A</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stats.slice(0, 5).map((row, i) => (
                                <tr key={i} className="border-b border-siyah/5 last:border-0">
                                  <td className="py-1 font-medium text-siyah">{row.season_label}</td>
                                  <td className="py-1 text-right tabular-nums text-siyah/80">{row.matches_played}</td>
                                  <td className="py-1 text-right tabular-nums text-bordo font-semibold">{row.goals}</td>
                                  <td className="py-1 text-right tabular-nums text-siyah/80">{row.assists}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
