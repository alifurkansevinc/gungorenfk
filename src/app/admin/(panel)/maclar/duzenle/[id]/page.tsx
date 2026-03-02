import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { MacForm } from "../../MacForm";

export default async function AdminMaclarDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const [
    { data: match },
    { data: goals },
    { data: lineups },
    { data: squad },
  ] = await Promise.all([
    supabase.from("matches").select("*").eq("id", id).single(),
    supabase.from("match_goals").select("minute, scorer_squad_id, assist_squad_id").eq("match_id", id).order("minute"),
    supabase.from("match_lineups").select("squad_member_id, role").eq("match_id", id).order("sort_order"),
    supabase.from("squad").select("id, name, shirt_number").eq("is_active", true).order("sort_order"),
  ]);
  if (!match) notFound();
  const starters = (lineups ?? []).filter((r) => r.role === "starter").map((r) => r.squad_member_id);
  const substitutes = (lineups ?? []).filter((r) => r.role === "substitute").map((r) => r.squad_member_id);

  return (
    <div>
      <Link href="/admin/maclar" className="text-sm text-bordo hover:underline">← Maç listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Maçı düzenle</h1>
      <MacForm
        match={match}
        squad={squad ?? []}
        matchGoals={(goals ?? []) as { minute: number; scorer_squad_id: string; assist_squad_id: string | null }[]}
        starters={starters}
        substitutes={substitutes}
        manOfTheMatchId={(match as { man_of_the_match_id?: string | null }).man_of_the_match_id ?? null}
      />
    </div>
  );
}
