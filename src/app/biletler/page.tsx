import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MacKartlari } from "./MacKartlari";

export const metadata = {
  title: "Maç Biletleri | Güngören FK",
  description: "Güngören FK maç biletlerini online alın. QR kod ile stadyum girişi.",
};

export default async function BiletlerPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: matches } = await supabase
    .from("matches")
    .select("id, opponent_name, home_away, venue, match_date, competition")
    .gte("match_date", today)
    .eq("status", "scheduled")
    .order("match_date")
    .limit(20);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="text-sm text-siyah/70">
            <Link href="/" className="hover:text-bordo transition-colors">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-siyah font-medium">Maç Biletleri</span>
          </nav>
          <h1 className="font-display mt-3 text-2xl font-bold text-siyah sm:text-3xl">Maç Biletleri</h1>
          <p className="mt-1 text-siyah/70">
            Bilet almak için önce bir maç seçin; bilet alma seçeneği seçtiğiniz maçın kartının içinde açılacaktır.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {(!matches || matches.length === 0) ? (
          <div className="rounded-2xl border border-siyah/10 bg-beyaz p-8 text-center text-siyah/70">
            Şu an satışa sunulan maç bulunmuyor.
          </div>
        ) : (
          <MacKartlari matches={matches} />
        )}
      </div>
    </div>
  );
}
