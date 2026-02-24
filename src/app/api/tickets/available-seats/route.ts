import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Maç için tüm koltukları + dolu koltuk id listesini döndürür (stadyum haritası için). */
export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId")?.trim();
  if (!matchId) {
    return NextResponse.json({ error: "matchId gerekli" }, { status: 400 });
  }
  const TARAFTAR_CAPACITY = 1000;
  const supabase = createServiceRoleClient();
  const [takenRes, seatsRes, taraftarRes] = await Promise.all([
    supabase
      .from("match_tickets")
      .select("seat_id")
      .eq("match_id", matchId)
      .not("seat_id", "is", null),
    supabase
      .from("stadium_seats")
      .select("id, seat_code, section, row_number, seat_in_row")
      .order("sort_order", { ascending: true }),
    supabase
      .from("match_tickets")
      .select("id")
      .eq("match_id", matchId)
      .is("seat_id", null)
      .in("payment_status", ["PAID", "PENDING"]),
  ]);
  const takenIds = new Set((takenRes.data ?? []).map((r) => (r as { seat_id: string }).seat_id));
  const taraftarSold = (taraftarRes.data ?? []).length;
  if (seatsRes.error) {
    return NextResponse.json({ error: seatsRes.error.message }, { status: 500 });
  }
  const raw = seatsRes.data ?? [];
  const seats = raw.map((s: { id: string; seat_code: string; section: string | null; row_number: number; seat_in_row: number }) => ({
    ...s,
    section: (s.section ?? "").trim().toUpperCase() || s.section,
  }));
  return NextResponse.json({
    seats,
    takenIds: Array.from(takenIds),
    taraftarCapacity: TARAFTAR_CAPACITY,
    taraftarSold,
  });
}
