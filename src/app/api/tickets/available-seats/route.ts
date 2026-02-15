import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Maç için dolu olmayan koltukları döndürür (bilet seçimi için). */
export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId")?.trim();
  if (!matchId) {
    return NextResponse.json({ error: "matchId gerekli" }, { status: 400 });
  }
  const supabase = createServiceRoleClient();
  const { data: taken } = await supabase
    .from("match_tickets")
    .select("seat_id")
    .eq("match_id", matchId)
    .not("seat_id", "is", null);
  const takenIds = new Set((taken ?? []).map((r) => (r as { seat_id: string }).seat_id));
  const { data: allSeats, error } = await supabase
    .from("stadium_seats")
    .select("id, seat_code, section, row_number, seat_in_row")
    .order("sort_order", { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const available = (allSeats ?? []).filter((s) => !takenIds.has(s.id));
  return NextResponse.json({ seats: available });
}
