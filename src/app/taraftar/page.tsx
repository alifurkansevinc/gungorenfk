import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FanLevelBadge } from "./FanLevelBadge";

export default async function TaraftarPanelPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/taraftar/kayit");
  }
  const { data: profile } = await supabase
    .from("fan_profiles")
    .select("*, fan_levels(name, slug)")
    .eq("user_id", user.id)
    .single();
  if (!profile) {
    redirect("/taraftar/kayit");
  }
  const level = profile.fan_levels as { name: string; slug: string } | null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah">Taraftar Panelim</h1>
      <p className="mt-1 text-siyah/70">{profile.first_name} {profile.last_name}</p>

      <div className="mt-8 rounded-xl border-2 border-bordo/30 bg-bordo/5 p-6">
        <h2 className="text-lg font-semibold text-siyah">Güngören BFK Fanı Rozeti</h2>
        <FanLevelBadge levelSlug={level?.slug ?? "beyaz"} levelName={level?.name ?? "Beyaz"} />
        <p className="mt-4 text-sm text-siyah/70">
          Puan: <strong>{profile.points}</strong>. Maçlara gelerek ve mağazadan alışveriş yaparak rozetini büyüt. Kademe kuralları yakında güncellenecek.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/magaza" className="rounded-lg bg-bordo px-4 py-2 text-beyaz hover:bg-bordo-dark transition-colors">Mağaza</Link>
        <Link href="/maclar" className="rounded-lg border border-siyah/20 px-4 py-2 text-siyah hover:bg-black/5 transition-colors">Maçlar</Link>
      </div>
    </div>
  );
}
