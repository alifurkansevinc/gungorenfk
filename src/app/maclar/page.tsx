import Link from "next/link";
import Image from "next/image";
import { getMatches } from "@/lib/data";
import { DEMO_IMAGES } from "@/lib/demo-images";

export const metadata = {
  title: "Maçlar | Güngören FK",
  description: "Güngören FK maç programı ve sonuçları.",
};

export default async function MaclarPage() {
  const matches = await getMatches(24);
  const nextMatch = matches.find((m) => m.status === "scheduled");
  const finished = matches.filter((m) => m.status === "finished");
  const scheduled = matches.filter((m) => m.status === "scheduled");

  return (
    <div className="min-h-screen">
      {/* Hero - tam genişlik görsel */}
      <section className="relative h-[50vh] min-h-[320px] flex items-end bg-siyah">
        <Image src={DEMO_IMAGES.stadium} alt="" fill className="object-cover opacity-80" unoptimized priority />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/50 to-transparent" />
        <div className="relative z-10 w-full mx-auto max-w-7xl px-4 pb-12 pt-20 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-beyaz sm:text-4xl md:text-5xl">Maçlar</h1>
          <p className="mt-2 text-beyaz/90">Fikstür ve sonuçlar</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Sonraki maç - büyük kart */}
        {nextMatch && (
          <section className="mb-14">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-4">Sonraki maç</h2>
            <Link href={`/maclar/${nextMatch.id}`} className="group block overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-lg transition-shadow hover:shadow-xl">
              <div className="grid md:grid-cols-5 gap-0">
                <div className="relative aspect-video md:aspect-auto md:col-span-2 md:min-h-[240px]">
                  <Image src={DEMO_IMAGES.match} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                </div>
                <div className="p-6 md:col-span-3 flex flex-col justify-center">
                  <p className="text-sm text-bordo font-semibold">{nextMatch.competition || "Lig"}</p>
                  <h3 className="mt-2 text-2xl font-bold text-siyah">{nextMatch.opponent_name}</h3>
                  <p className="mt-2 text-siyah/70">{new Date(nextMatch.match_date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                  {nextMatch.venue && <p className="mt-1 text-siyah/70">{nextMatch.venue}</p>}
                  <span className="mt-4 inline-block text-bordo font-semibold">Maç detayı →</span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Fikstür ve sonuçlar - tablo tarzı */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60 mb-4">Fikstür ve sonuçlar</h2>
          <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-siyah/10 bg-siyah/5">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70">Tarih</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70">Müsabaka</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70">Maç</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-siyah/70 text-center">Sonuç</th>
                  </tr>
                </thead>
                <tbody>
                  {matches.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-siyah/60">Henüz maç eklenmedi.</td></tr>
                  ) : (
                    [...scheduled, ...finished].map((m) => (
                      <tr key={m.id} className="border-b border-siyah/5 hover:bg-siyah/[0.02]">
                        <td className="px-4 py-4 text-sm text-siyah/80">{new Date(m.match_date).toLocaleDateString("tr-TR")}</td>
                        <td className="px-4 py-4 text-sm text-siyah/80">{m.competition || "—"}</td>
                        <td className="px-4 py-4">
                          <Link href={`/maclar/${m.id}`} className="font-medium text-siyah hover:text-bordo">
                            {m.home_away === "home" ? "Güngören FK" : m.opponent_name} - {m.home_away === "away" ? "Güngören FK" : m.opponent_name}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {m.status === "finished" && m.goals_for != null && m.goals_against != null ? (
                            <span className="font-bold text-bordo">{m.goals_for} - {m.goals_against}</span>
                          ) : (
                            <span className="text-siyah/50">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
