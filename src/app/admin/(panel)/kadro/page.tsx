import { getAdminSupabase } from "../../actions";
import { AdminKadroClient } from "./AdminKadroClient";

export default async function AdminKadroPage() {
  const supabase = await getAdminSupabase();
  const { data: squad } = await supabase
    .from("squad")
    .select(
      "id, name, shirt_number, position, position_category, sort_order, is_active, is_captain, season, optaport_player_id",
    )
    .order("season", { ascending: false, nullsFirst: false })
    .order("sort_order");

  return <AdminKadroClient squad={squad ?? []} />;
}
