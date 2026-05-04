import { createClient } from "@/lib/supabase/server";

export type HomeMotmLotteryBanner = {
  title: string;
  description: string | null;
  winners: { place: number; displayName: string }[];
};

/** Anon + RLS: yalnızca show_on_homepage ve drawn etkinlik okunur. */
export async function getHomeBannerMotmLottery(): Promise<HomeMotmLotteryBanner | null> {
  const supabase = await createClient();
  const { data: ev } = await supabase
    .from("motm_lottery_events")
    .select("id, title, description")
    .eq("show_on_homepage", true)
    .eq("status", "drawn")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!ev) return null;

  const { data: draw } = await supabase.from("motm_lottery_draws").select("id").eq("event_id", (ev as { id: string }).id).maybeSingle();
  if (!draw) return null;

  const { data: winners } = await supabase
    .from("motm_lottery_winners")
    .select("place, display_name")
    .eq("draw_id", (draw as { id: string }).id)
    .order("place", { ascending: true });

  const list = (winners ?? []) as { place: number; display_name: string | null }[];
  if (list.length === 0) return null;

  return {
    title: (ev as { title: string }).title,
    description: (ev as { description: string | null }).description,
    winners: list.map((w) => ({
      place: w.place,
      displayName: (w.display_name?.trim() || "Taraftar").trim(),
    })),
  };
}
