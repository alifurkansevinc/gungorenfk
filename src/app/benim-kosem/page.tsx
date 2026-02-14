import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSquad, getFanLevels } from "@/lib/data";
import type { FanLevel } from "@/types/db";
import { FanLevelBadge } from "@/app/taraftar/FanLevelBadge";
import { FavoriOyuncuSec } from "./FavoriOyuncuSec";

export const metadata = {
  title: "Benim Köşem | Güngören FK",
  description: "Taraftar paneli: rozet, favori oyuncu, haklar.",
};

/** Seviyeye göre hak kazandıklarım metni (backend ile genişletilebilir). */
function getHakKazandiklarim(levelSlug: string): string[] {
  const haklar: Record<string, string[]> = {
    "as-oyuncu": ["Resmi taraftar rozeti", "Maestro’ya doğru ilerleme hakkı"],
    maestro: ["Maçların vazgeçilmezi rozeti", "Kapitano’ya doğru ilerleme hakkı"],
    kapitano: ["Koltuk numarası", "Mağazada %25 indirim", "General’a doğru ilerleme hakkı"],
    general: ["Resmi kongre üyesi", "Mağazada %30 indirim", "Efsane’ye doğru ilerleme hakkı"],
    efsane: [
      "Her sene 2 sezon forman isminle",
      "Her sene 5 maç protokol bileti",
      "Mağazada %35 indirim",
      "Her sene 10 takım rozeti",
      "Atkı, şapka, yağmurluk seti",
    ],
  };
  return haklar[levelSlug] ?? haklar["as-oyuncu"];
}

export default async function BenimKosemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/kayit");

  const { data: profile } = await supabase
    .from("fan_profiles")
    .select("*, fan_levels(id, name, slug, min_points, sort_order, description, target_store_spend, target_tickets, target_donation)")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/taraftar/kayit");

  const [squad, levels] = await Promise.all([getSquad(), getFanLevels()]);
  const level = profile.fan_levels as FanLevel | null;
  const currentLevel = level ?? levels[0] ?? { id: 1, name: "As Oyuncu", slug: "as-oyuncu", min_points: 0, sort_order: 1, description: null, target_store_spend: null, target_tickets: null, target_donation: null };
  const nextLevel = levels.find((l) => l.sort_order === currentLevel.sort_order + 1);
  const favoritePlayerId = (profile as { favorite_player_id?: string | null }).favorite_player_id ?? null;
  const favoritePlayer = favoritePlayerId ? squad.find((p) => p.id === favoritePlayerId) : null;

  const storeSpend = Number((profile as { store_spend_total?: number }).store_spend_total ?? 0);
  const ticketsCount = Number((profile as { match_tickets_count?: number }).match_tickets_count ?? 0);
  const donationTotal = Number((profile as { donation_total?: number }).donation_total ?? 0);

  const nextTargetStore = nextLevel?.target_store_spend != null ? Number(nextLevel.target_store_spend) : 500;
  const nextTargetTickets = nextLevel?.target_tickets ?? 5;
  const nextTargetDonation = nextLevel?.target_donation != null ? Number(nextLevel.target_donation) : 100;
  const barStore = nextTargetStore > 0 ? Math.min(100, (storeSpend / nextTargetStore) * 100) : 0;
  const barTickets = nextTargetTickets > 0 ? Math.min(100, (ticketsCount / nextTargetTickets) * 100) : 0;
  const barDonation = nextTargetDonation > 0 ? Math.min(100, (donationTotal / nextTargetDonation) * 100) : 0;
  const overallBar = nextLevel ? (barStore + barTickets + barDonation) / 3 : 100;

  const hakKazandiklarim = getHakKazandiklarim(currentLevel.slug);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="border-b border-siyah/10 bg-siyah text-beyaz">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <nav className="text-sm text-beyaz/60">
            <Link href="/" className="hover:text-beyaz">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz">Benim Köşem</span>
          </nav>
          <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">Benim Köşem</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Rozet + açıklama */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Güngören BFK Rozeti</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <FanLevelBadge levelSlug={currentLevel.slug} levelName={currentLevel.name} />
              </div>
              {currentLevel.description && (
                <p className="mt-4 text-sm text-siyah/80 leading-relaxed">{currentLevel.description}</p>
              )}
            </section>

            {/* Sonraki rozetin için — 3 barem */}
            {nextLevel && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-siyah">Sonraki rozetin için</h2>
                <p className="mt-1 text-sm text-siyah/70">Sonraki kademe: <strong>{nextLevel.name}</strong>. Aşağıdaki üç barem backend tarafından ayarlanır.</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-siyah/80">Mağaza alışveriş baremi</span>
                      <span className="tabular-nums text-siyah/70">{storeSpend.toFixed(0)} ₺ / {nextTargetStore} ₺</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barStore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-siyah/80">Maç biletleri baremi</span>
                      <span className="tabular-nums text-siyah/70">{ticketsCount} / {nextTargetTickets}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barTickets}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-siyah/80">Bağış baremi</span>
                      <span className="tabular-nums text-siyah/70">{donationTotal.toFixed(0)} ₺ / {nextTargetDonation} ₺</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barDonation}%` }} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-siyah">Toplam ilerleme (sonraki rozet)</span>
                      <span className="tabular-nums text-bordo font-medium">{Math.round(overallBar)}%</span>
                    </div>
                    <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill progress-bar-glow h-full rounded-full bg-bordo" style={{ width: `${overallBar}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            )}
            {!nextLevel && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-siyah">Sonraki rozetin için</h2>
                <p className="mt-2 text-sm text-siyah/70">En yüksek kademe (Efsane) rozetindesin.</p>
              </section>
            )}

            {/* Favori oyuncu */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Favori Oyuncum</h2>
              <p className="mt-1 text-sm text-siyah/70">Favori oyuncun gol atınca ek puan kazanacaksın (sistem yakında aktif olacak).</p>
              <div className="mt-4">
                <FavoriOyuncuSec currentFavoriteId={favoritePlayerId} squad={squad} />
              </div>
              {favoritePlayer && (
                <div className="mt-4 flex items-center gap-4 rounded-xl border border-siyah/10 bg-siyah/5 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bordo text-xl font-bold text-beyaz">
                    {favoritePlayer.shirt_number ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-siyah">{favoritePlayer.name}</p>
                    {favoritePlayer.position && <p className="text-sm text-siyah/70">{favoritePlayer.position}</p>}
                  </div>
                  <Link href="/kadro" className="ml-auto text-sm font-medium text-bordo hover:underline">Kadro →</Link>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {/* Hak kazandıklarım */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Hak kazandıklarım</h2>
              <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-siyah/80">
                {hakKazandiklarim.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </section>

            {/* Hızlı işlemler + Ayarlar */}
            <section className="rounded-2xl border border-siyah/10 bg-bordo/10 p-6">
              <h2 className="font-display text-lg font-bold text-siyah">Hızlı işlemler</h2>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/benim-kosem/ayarlar" className="rounded-lg border-2 border-siyah/20 px-4 py-3 font-medium text-siyah hover:bg-siyah/5 transition-colors text-center">
                  Ayarlar
                </Link>
                <Link href="/maclar" className="rounded-lg bg-bordo px-4 py-3 font-medium text-beyaz hover:bg-bordo-dark transition-colors text-center">
                  Maçlar
                </Link>
                <Link href="/magaza" className="rounded-lg border-2 border-bordo px-4 py-3 font-medium text-bordo hover:bg-bordo/10 transition-colors text-center">
                  Mağaza
                </Link>
                <Link href="/kadro" className="rounded-lg border-2 border-siyah/20 px-4 py-3 font-medium text-siyah hover:bg-siyah/5 transition-colors text-center">
                  Kadro
                </Link>
                <Link href="/haberler" className="rounded-lg border-2 border-siyah/20 px-4 py-3 font-medium text-siyah hover:bg-siyah/5 transition-colors text-center">
                  Etkinlikler
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
