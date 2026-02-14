import Link from "next/link";
import Image from "next/image";

type NextMatch = {
  id: string;
  opponent_name: string;
  home_away: string;
  venue: string | null;
  match_date: string;
  match_time: string | null;
  opponent_logo_url: string | null;
  competition: string | null;
} | null;

export function NextMatchCard({ match }: { match: NextMatch }) {
  if (!match) {
    return (
      <section className="mb-14">
        <div className="relative overflow-hidden rounded-3xl border-2 border-siyah/10 bg-gradient-to-br from-siyah/5 to-siyah/10 px-8 py-12 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,21,56,0.15),transparent)]" />
          <p className="relative text-siyah/60">Önümüzdeki maç henüz belirlenmedi. Admin panelinden Maçlar bölümünden ekleyebilirsiniz.</p>
        </div>
      </section>
    );
  }

  const isHome = match.home_away === "home";
  const matchLabel = isHome
    ? `Güngören FK - ${match.opponent_name}`
    : `${match.opponent_name} - Güngören FK`;
  const dateStr = new Date(match.match_date + "T12:00:00").toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = match.match_time?.trim() || "";

  return (
    <section className="mb-14">
      <div className="group relative overflow-hidden rounded-3xl bg-siyah shadow-2xl">
        {/* Arka plan: gradient + hafif desen */}
        <div className="absolute inset-0 bg-gradient-to-br from-bordo/90 via-siyah to-siyah" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah/80 via-transparent to-bordo/20" />

        <div className="relative z-10 px-6 py-10 sm:px-10 sm:py-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-beyaz/70">
            {match.competition || "Maç"}
          </p>
          <h2 className="mb-8 text-center text-xl font-bold text-beyaz sm:text-2xl md:text-3xl">
            Önümüzdeki maç
          </h2>

          {/* Takımlar: logolar + isimler */}
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            {/* Sol: ev sahibi */}
            <div className="flex flex-1 flex-col items-center justify-center">
              {isHome ? (
                <>
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-beyaz/30 bg-bordo shadow-lg sm:h-24 sm:w-24">
                    <Image src="/logogbfk.png" alt="Güngören FK" fill className="object-contain p-2" unoptimized />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold text-beyaz sm:text-xl">Güngören FK</p>
                </>
              ) : (
                <>
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-beyaz/30 bg-beyaz/10 shadow-lg sm:h-24 sm:w-24">
                    {match.opponent_logo_url ? (
                      <Image src={match.opponent_logo_url} alt={match.opponent_name} fill className="object-contain p-2" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-beyaz/80">
                        {match.opponent_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-lg font-bold text-beyaz sm:text-xl">{match.opponent_name}</p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 text-bordo">
              <span className="text-2xl font-bold sm:text-3xl">VS</span>
            </div>

            {/* Sağ: deplasman */}
            <div className="flex flex-1 flex-col items-center justify-center">
              {isHome ? (
                <>
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-beyaz/30 bg-beyaz/10 shadow-lg sm:h-24 sm:w-24">
                    {match.opponent_logo_url ? (
                      <Image src={match.opponent_logo_url} alt={match.opponent_name} fill className="object-contain p-2" unoptimized />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-beyaz/80">
                        {match.opponent_name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-lg font-bold text-beyaz sm:text-xl">{match.opponent_name}</p>
                </>
              ) : (
                <>
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-beyaz/30 bg-bordo shadow-lg sm:h-24 sm:w-24">
                    <Image src="/logogbfk.png" alt="Güngören FK" fill className="object-contain p-2" unoptimized />
                  </div>
                  <p className="mt-3 font-display text-lg font-bold text-beyaz sm:text-xl">Güngören FK</p>
                </>
              )}
            </div>
          </div>

          {/* Tarih, saat, yer */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 border-t border-beyaz/20 pt-8">
            <div className="flex items-center gap-2 text-beyaz/90">
              <svg className="h-5 w-5 text-bordo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium capitalize">{dateStr}</span>
            </div>
            {timeStr && (
              <div className="flex items-center gap-2 text-beyaz/90">
                <svg className="h-5 w-5 text-bordo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{timeStr}</span>
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-2 text-beyaz/90">
                <svg className="h-5 w-5 text-bordo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">{match.venue}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={`/maclar/${match.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-beyaz px-6 py-3 font-bold text-siyah shadow-lg transition-all hover:bg-beyaz/90 hover:scale-105"
            >
              Maç detayı
            </Link>
            <Link
              href="/biletler"
              className="ml-4 inline-flex items-center gap-2 rounded-xl border-2 border-beyaz/50 px-6 py-3 font-bold text-beyaz transition-all hover:bg-beyaz/10"
            >
              Bilet al
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
