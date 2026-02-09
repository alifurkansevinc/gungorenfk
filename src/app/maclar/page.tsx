import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Maçlar | Güngören FK",
  description: "Güngören FK maç programı ve sonuçları.",
};

export default async function MaclarPage() {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("id, opponent_name, home_away, venue, match_date, goals_for, goals_against, status, competition")
    .order("match_date", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Maçlar</h1>
      <p className="mt-2 text-siyah/70">Maç programı ve sonuçları. Skorlar admin panelinden veya ileride entegre edilecek bir kaynaktan güncellenir.</p>
      <div className="mt-8 space-y-4">
        {(!matches || matches.length === 0) ? (
          <p className="text-siyah/60">Henüz maç eklenmedi.</p>
        ) : (
          matches.map((m) => (
            <Link key={m.id} href={`/maclar/${m.id}`} className="block rounded-xl border border-black/10 p-4 hover:bg-black/5 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-siyah">{m.opponent_name}</span>
                <span className="text-sm text-siyah/70">{new Date(m.match_date).toLocaleDateString("tr-TR")} · {m.home_away === "home" ? "İç saha" : "Deplasman"}</span>
              </div>
              {m.status === "finished" && m.goals_for !== null && m.goals_against !== null && (
                <p className="mt-2 text-bordo font-semibold">Güngören FK {m.goals_for} - {m.goals_against} {m.opponent_name}</p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
