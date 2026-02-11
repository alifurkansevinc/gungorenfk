import Link from "next/link";
import Image from "next/image";
import { getMatchById } from "@/lib/data";
import { notFound } from "next/navigation";
import { DEMO_IMAGES } from "@/lib/demo-images";

export default async function MacDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  return (
    <div className="min-h-screen">
      {/* Hero görsel */}
      <section className="relative h-[14vh] min-h-[100px] flex items-end bg-siyah">
        <Image src={DEMO_IMAGES.match} alt="" fill className="object-cover opacity-80" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/60 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-beyaz sm:text-2xl md:text-3xl">
            {match.home_away === "home" ? "Güngören FK" : match.opponent_name} - {match.home_away === "away" ? "Güngören FK" : match.opponent_name}
          </h1>
          <p className="mt-1 text-sm text-beyaz/90">{new Date(match.match_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
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
                <span className="text-4xl font-bold text-bordo">{match.goals_for} - {match.goals_against}</span>
                <span className="text-2xl font-bold text-siyah">{match.opponent_name}</span>
              </div>
            </>
          ) : (
            <p className="text-siyah/70">Bu maç henüz oynanmadı.</p>
          )}
        </div>

        {/* Bilgiler */}
        <div className="mt-8 space-y-2 text-siyah/80">
          {match.venue && <p><span className="font-medium text-siyah">Salon / Stadyum:</span> {match.venue}</p>}
          <p><span className="font-medium text-siyah">Tarih:</span> {new Date(match.match_date).toLocaleDateString("tr-TR")}</p>
          <p><span className="font-medium text-siyah">Durum:</span> {match.status === "finished" ? "Oynandı" : match.status === "scheduled" ? "Programda" : match.status}</p>
        </div>

        <Link href="/maclar" className="mt-10 inline-block text-bordo font-semibold hover:underline">← Tüm maçlar</Link>
      </div>
    </div>
  );
}
