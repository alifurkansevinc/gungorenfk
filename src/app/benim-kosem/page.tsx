import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSquad, getFanLevels } from "@/lib/data";
import { FanLevelBadge } from "@/app/taraftar/FanLevelBadge";
import { FavoriOyuncuSec } from "./FavoriOyuncuSec";

export const metadata = {
  title: "Benim Köşem | Güngören FK",
  description: "Taraftar paneli: rozet, favori oyuncu, puanlar.",
};

export default async function BenimKosemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/kayit");

  const { data: profile } = await supabase
    .from("fan_profiles")
    .select("*, fan_levels(id, name, slug, min_points, sort_order)")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/taraftar/kayit");

  const [squad, levels] = await Promise.all([getSquad(), getFanLevels()]);
  const level = profile.fan_levels as { id: number; name: string; slug: string; min_points: number; sort_order: number } | null;
  const currentLevel = level ?? { id: 1, name: "Beyaz", slug: "beyaz", min_points: 0, sort_order: 1 };
  const nextLevel = levels.find((l) => l.sort_order === currentLevel.sort_order + 1);
  const points = profile.points ?? 0;
  const progressPercent = nextLevel
    ? Math.min(100, ((points - currentLevel.min_points) / (nextLevel.min_points - currentLevel.min_points)) * 100)
    : 100;
  const favoritePlayerId = (profile as { favorite_player_id?: string | null }).favorite_player_id ?? null;
  const favoritePlayer = favoritePlayerId ? squad.find((p) => p.id === favoritePlayerId) : null;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Üst: Hoş geldin bandı */}
      <div className="border-b border-siyah/10 bg-siyah text-beyaz">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="text-sm text-beyaz/60">
            <Link href="/" className="hover:text-beyaz">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz">Benim Köşem</span>
          </nav>
          <h1 className="font-display mt-3 text-2xl font-bold sm:text-3xl">Benim Köşem</h1>
          <p className="mt-1 text-beyaz/80">
            Hoş geldin, {profile.first_name}. Rozetini, favori oyuncunu ve puanlarını buradan takip et.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sol: Rozet ve ilerleme */}
          <div className="lg:col-span-2 space-y-6">
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Güngören BFK Rozeti</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <FanLevelBadge levelSlug={currentLevel.slug} levelName={currentLevel.name} />
                <span className="text-2xl font-bold tabular-nums text-bordo">{points} puan</span>
              </div>
              {nextLevel && (
                <div className="mt-4">
                  <p className="text-sm text-siyah/70">
                    Sonraki kademe: <strong>{nextLevel.name}</strong> ({nextLevel.min_points} puan)
                  </p>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-siyah/10">
                    <div
                      className="progress-fill h-full rounded-full bg-bordo"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
              {!nextLevel && (
                <p className="mt-2 text-sm text-siyah/70">En yüksek kademedesin. Maçlara gelerek ve mağazadan alışveriş yaparak puan kazanırsın.</p>
              )}
            </section>

            {/* Favori oyuncu */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Favori Oyuncum</h2>
              <p className="mt-1 text-sm text-siyah/70">
                Favori oyuncun gol atınca ek puan kazanacaksın (sistem yakında aktif olacak).
              </p>
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

          {/* Sağ: Özet ve linkler */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Profil özeti</h2>
              <ul className="mt-3 space-y-2 text-sm text-siyah/80">
                <li><strong>Ad soyad:</strong> {profile.first_name} {profile.last_name}</li>
                <li><strong>E-posta:</strong> {profile.email}</li>
                <li><strong>Puan:</strong> {points}</li>
                <li><strong>Kademe:</strong> {currentLevel.name}</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-siyah/10 bg-bordo/10 p-6">
              <h2 className="font-display text-lg font-bold text-siyah">Hızlı linkler</h2>
              <div className="mt-4 flex flex-col gap-2">
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
                  Gelişmeler
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
