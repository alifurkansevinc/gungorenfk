import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function MacDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();
  if (!match) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah">{match.opponent_name}</h1>
      <p className="mt-2 text-siyah/70">{new Date(match.match_date).toLocaleDateString("tr-TR")} · {match.home_away === "home" ? "İç saha" : "Deplasman"}</p>
      {match.venue && <p className="mt-1 text-siyah/70">{match.venue}</p>}
      {match.status === "finished" && match.goals_for !== null && match.goals_against !== null && (
        <p className="mt-6 text-3xl font-bold text-bordo">Güngören FK {match.goals_for} - {match.goals_against} {match.opponent_name}</p>
      )}
    </div>
  );
}
