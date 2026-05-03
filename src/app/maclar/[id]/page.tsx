import Link from "next/link";
import Image from "next/image";
import { Radio } from "lucide-react";
import { getMatchById, getMatchLineupForMatch } from "@/lib/data";
import { notFound } from "next/navigation";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { MatchPageRefresh } from "@/components/MatchPageRefresh";

export default async function MacDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const showLineup = match.status === "live" || match.status === "finished";
  const lineup = showLineup ? await getMatchLineupForMatch(id) : { starters: [], substitutes: [] };
  const refreshEnabled = !id.startsWith("demo-") && (match.status === "live" || match.status === "scheduled");

  const statusLabel =
    match.status === "finished"
      ? "Oynandı"
      : match.status === "live"
        ? "Canlı"
        : match.status === "scheduled"
          ? "Programda"
          : match.status;

  return (
    <div className="min-h-screen">
      <MatchPageRefresh enabled={refreshEnabled} />
      {/* Hero görsel */}
      <section className="relative h-[14vh] min-h-[100px] flex items-end bg-siyah">
        <Image src={DEMO_IMAGES.match} alt="" fill className="object-cover opacity-80" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/60 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            {match.status === "live" && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/50 bg-red-600/30 px-3 py-1 text-xs font-black uppercase tracking-widest text-beyaz animate-pulse">
                <Radio className="h-4 w-4" aria-hidden />
                Canlı
              </span>
            )}
            <h1 className="text-xl font-bold text-beyaz sm:text-2xl md:text-3xl">
              {match.home_away === "home" ? "Güngören FK" : match.opponent_name} -{" "}
              {match.home_away === "away" ? "Güngören FK" : match.opponent_name}
            </h1>
          </div>
          <p className="mt-1 text-sm text-beyaz/90">
            {new Date(match.match_date + "T12:00:00").toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {match.match_time?.trim() ? ` · ${match.match_time.trim()}` : ""}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Skor kutusu */}
        <div className="rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-sm text-center">
          {match.status === "finished" && match.goals_for !== null && match.goals_against !== null ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wider text-siyah/60">Maç sonucu</p>
              <div className="mt-4 flex items-center justify-center gap-6 flex-wrap">
                <span className="text-2xl font-bold text-siyah">Güngören FK</span>
                <span className="text-4xl font-bold text-bordo">
                  {match.goals_for} - {match.goals_against}
                </span>
                <span className="text-2xl font-bold text-siyah">{match.opponent_name}</span>
              </div>
            </>
          ) : match.status === "live" ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-wider text-red-600">Maç devam ediyor</p>
              <p className="mt-4 text-siyah/80">Skor girildiğinde burada görünecek.</p>
            </>
          ) : (
            <p className="text-siyah/70">Bu maç henüz oynanmadı.</p>
          )}
        </div>

        {/* Bilgiler */}
        <div className="mt-8 space-y-2 text-siyah/80">
          {match.venue && (
            <p>
              <span className="font-medium text-siyah">Salon / Stadyum:</span> {match.venue}
            </p>
          )}
          <p>
            <span className="font-medium text-siyah">Tarih:</span>{" "}
            {new Date(match.match_date + "T12:00:00").toLocaleDateString("tr-TR")}
          </p>
          <p>
            <span className="font-medium text-siyah">Durum:</span> {statusLabel}
          </p>
        </div>

        {/* Kadro — yalnız canlı veya bitmiş maçta */}
        {showLineup && (lineup.starters.length > 0 || lineup.substitutes.length > 0) && (
          <div className="mt-10 rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60">Maç kadrosu</h2>
            {lineup.starters.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-bordo">İlk 11</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {lineup.starters.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-lg border border-siyah/5 bg-siyah/[0.02] px-3 py-2 text-sm">
                      {p.shirt_number != null && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-siyah text-xs font-bold text-beyaz">
                          {p.shirt_number}
                        </span>
                      )}
                      <span className="font-medium text-siyah">
                        {p.name}
                        {p.is_captain ? " (K)" : ""}
                      </span>
                      {p.position && <span className="ml-auto text-xs text-siyah/50">{p.position}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {lineup.substitutes.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-siyah/60">Yedekler</p>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {lineup.substitutes.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 rounded-lg border border-siyah/5 px-3 py-2 text-sm text-siyah/90">
                      {p.shirt_number != null && (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-siyah/20 text-xs font-bold">
                          {p.shirt_number}
                        </span>
                      )}
                      <span className="font-medium">{p.name}</span>
                      {p.position && <span className="ml-auto text-xs text-siyah/50">{p.position}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <Link href="/maclar" className="mt-10 inline-block text-bordo font-semibold hover:underline">
          ← Tüm maçlar
        </Link>
      </div>
    </div>
  );
}
