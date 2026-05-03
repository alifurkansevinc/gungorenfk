import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DEMO_IMAGES } from "@/lib/demo-images";

export async function WeekPlayerShowcase() {
  const supabase = await createClient();
  const { data: awards } = await supabase
    .from("week_player_awards")
    .select("id, season, week_number, match_id, squad_id")
    .order("season", { ascending: false })
    .order("week_number", { ascending: false })
    .limit(24);

  if (!awards?.length) {
    return (
      <section className="border-b border-siyah/10 bg-beyaz py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-xl font-bold text-siyah sm:text-2xl">Haftanın oyuncuları</h2>
          <p className="mt-2 text-sm text-siyah/60">Henüz kayıtlı haftanın oyuncusu duyurusu yok.</p>
        </div>
      </section>
    );
  }

  const squadIds = [...new Set(awards.map((a) => (a as { squad_id: string }).squad_id))];
  const { data: squadRows } = await supabase
    .from("squad")
    .select("id, name, shirt_number, photo_url, position")
    .in("id", squadIds);

  const squadMap = new Map((squadRows ?? []).map((r) => [r.id, r]));

  return (
    <section className="border-b border-siyah/10 bg-gradient-to-b from-beyaz via-bordo/[0.04] to-beyaz py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-bordo/80">Duvar</p>
            <h2 className="font-display text-2xl font-bold text-siyah sm:text-3xl">Haftanın oyuncuları</h2>
            <p className="mt-1 max-w-xl text-sm text-siyah/65">
              Sezon boyunca seçilen performanslar burada kalıcı olarak listelenir.
            </p>
          </div>
          <Link href="/maclar" className="text-sm font-semibold text-bordo hover:underline">
            Tüm maçlar →
          </Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {awards.map((row) => {
            const a = row as { id: string; season: string; week_number: number; squad_id: string };
            const p = squadMap.get(a.squad_id) as
              | { id: string; name: string; shirt_number: number | null; photo_url: string | null; position: string | null }
              | undefined;
            const img = p?.photo_url || DEMO_IMAGES.product;
            return (
              <article
                key={a.id}
                className="group overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] bg-siyah/5">
                  <Image src={img} alt="" fill className="object-cover object-top transition duration-500 group-hover:scale-105" sizes="280px" unoptimized />
                  <div className="absolute left-3 top-3 rounded-full bg-bordo px-3 py-1 text-xs font-bold text-beyaz shadow">
                    {a.season} · {a.week_number}. hafta
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-display text-lg font-bold text-siyah">
                    {p?.shirt_number != null ? `${p.shirt_number}. ` : ""}
                    {p?.name ?? "Oyuncu"}
                  </p>
                  {p?.position && <p className="text-sm text-siyah/60">{p.position}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
