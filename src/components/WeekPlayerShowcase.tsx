import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { sortSeasonLabelsDesc } from "@/lib/seasons";

export async function WeekPlayerShowcase() {
  const supabase = await createClient();
  const { data: awards } = await supabase
    .from("week_player_awards")
    .select("id, season, week_number, match_id, squad_id")
    .order("season", { ascending: false })
    .order("week_number", { ascending: false })
    .limit(40);

  if (!awards?.length) {
    return (
      <section className="border-b border-white/10 bg-black py-6">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-zinc-500">Haftanın oyuncuları</h2>
          <p className="mt-2 text-xs text-zinc-500">Henüz kayıtlı duyuru yok.</p>
        </div>
      </section>
    );
  }

  const seasons = sortSeasonLabelsDesc(awards.map((a) => (a as { season: string }).season));
  const wallSeason = seasons[0]!;
  const wallAwards = awards.filter((r) => (r as { season: string }).season === wallSeason).slice(0, 12);

  const squadIds = [...new Set(wallAwards.map((a) => (a as { squad_id: string }).squad_id))];
  const { data: squadRows } = await supabase
    .from("squad")
    .select("id, name, shirt_number, photo_url, position")
    .in("id", squadIds);

  const squadMap = new Map((squadRows ?? []).map((r) => [r.id, r]));

  return (
    <section className="border-b border-white/10 bg-black py-6 sm:py-7">
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-500">Duvar</p>
            <h2 className="mt-0.5 font-display text-base font-bold text-white sm:text-lg">Haftanın oyuncuları</h2>
            <p className="mt-0.5 text-[11px] text-zinc-500">{wallSeason} sezonu</p>
          </div>
          <Link href="/maclar" className="text-[11px] font-semibold text-bordo hover:text-bordo/90">
            Maçlar →
          </Link>
        </div>

        <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {wallAwards.map((row) => {
            const a = row as { id: string; season: string; week_number: number; squad_id: string };
            const p = squadMap.get(a.squad_id) as
              | { id: string; name: string; shirt_number: number | null; photo_url: string | null; position: string | null }
              | undefined;
            const img = p?.photo_url || DEMO_IMAGES.product;
            return (
              <article
                key={a.id}
                className="w-[104px] shrink-0 overflow-hidden rounded-lg border border-white/10 bg-zinc-950/80 sm:w-[118px]"
              >
                <div className="relative aspect-[3/4] bg-zinc-900">
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-cover object-top"
                    sizes="120px"
                    unoptimized
                  />
                  <span className="absolute left-1 top-1 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {a.week_number}.h
                  </span>
                </div>
                <div className="px-1.5 py-2">
                  <p className="truncate text-center text-[10px] font-bold leading-tight text-white" title={p?.name ?? ""}>
                    {p?.shirt_number != null ? `${p.shirt_number}. ` : ""}
                    {p?.name ?? "—"}
                  </p>
                  {p?.position && (
                    <p className="truncate text-center text-[9px] text-zinc-500" title={p.position}>
                      {p.position}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
