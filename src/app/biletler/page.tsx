import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MacKartlari } from "./MacKartlari";
import { EtkinlikKartlari } from "./EtkinlikKartlari";

export const metadata = {
  title: "Biletler | Güngören FK",
  description: "Güngören FK maç ve etkinlik biletlerini online alın. QR kod ile giriş.",
};

export default async function BiletlerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/giris?redirect=" + encodeURIComponent("/biletler"));

  const today = new Date().toISOString().slice(0, 10);
  const [matchesRes, eventsRes] = await Promise.all([
    supabase
      .from("matches")
      .select("id, opponent_name, home_away, venue, match_date, match_time, competition, opponent_logo_url")
      .gte("match_date", today)
      .eq("status", "scheduled")
      .order("match_date")
      .limit(20),
    supabase
      .from("news")
      .select("id, title, slug, event_date, event_end_date, event_time, event_place, event_type")
      .eq("is_ticketed", true)
      .or(`event_date.gte.${today},event_end_date.gte.${today}`)
      .order("event_date", { ascending: true })
      .limit(20),
  ]);
  const matches = matchesRes.data ?? [];
  const ticketedEvents = eventsRes.data ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-siyah/5 via-[#f8f8f8] to-bordo/5">
      <div className="relative overflow-hidden border-b border-siyah/10 bg-gradient-to-br from-siyah via-siyah to-bordo/90 text-beyaz">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,21,56,0.4),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <nav className="text-sm text-beyaz/70">
            <Link href="/" className="hover:text-beyaz transition-colors">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz font-medium">Biletler</span>
          </nav>
          <h1 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Biletler</h1>
          <p className="mt-2 max-w-xl text-beyaz/80">
            Maç biletleri için bir maç seçip koltuk seçin; etkinlik biletleri için listeden <strong>Ücretsiz Bilet Al</strong> ile alın.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-14">
        <section>
          <h2 className="text-xl font-bold text-siyah mb-4">Maç Biletleri</h2>
          {(!matches || matches.length === 0) ? (
            <div className="rounded-2xl border-2 border-dashed border-siyah/20 bg-beyaz/80 p-12 text-center text-siyah/60 shadow-inner">
              <p className="font-medium">Şu an satışa sunulan maç bulunmuyor.</p>
              <p className="mt-1 text-sm">Yakında yeni maçlar eklenecektir.</p>
            </div>
          ) : (
            <MacKartlari matches={matches} />
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-siyah mb-4">Etkinlik Biletleri</h2>
          {ticketedEvents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-siyah/20 bg-beyaz/80 p-12 text-center text-siyah/60 shadow-inner">
              <p className="font-medium">Şu an biletli etkinlik bulunmuyor.</p>
              <p className="mt-1 text-sm">Etkinlikler sayfasından biletli etkinlikleri takip edebilirsiniz.</p>
              <Link href="/haberler" className="mt-3 inline-block text-sm font-medium text-bordo hover:underline">Etkinlikler →</Link>
            </div>
          ) : (
            <EtkinlikKartlari events={ticketedEvents} />
          )}
        </section>
      </div>
    </div>
  );
}
