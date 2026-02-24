import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const SECTIONS = ["A", "B", "C", "D", "E"];

/** Maç için tüm koltukları + dolu koltuk id listesini döndürür. Bölüm bazlı çekerek E blok dahil hepsinin gelmesini garanti eder. */
export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId")?.trim();
  if (!matchId) {
    return NextResponse.json({ error: "matchId gerekli" }, { status: 400 });
  }
  const TARAFTAR_CAPACITY = 1000;
  const supabase = createServiceRoleClient();

  const [takenRes, taraftarRes, ...sectionResults] = await Promise.all([
    supabase
      .from("match_tickets")
      .select("seat_id")
      .eq("match_id", matchId)
      .not("seat_id", "is", null),
    supabase
      .from("match_tickets")
      .select("id")
      .eq("match_id", matchId)
      .is("seat_id", null)
      .in("payment_status", ["PAID", "PENDING"]),
    ...SECTIONS.map((section) =>
      supabase
        .from("stadium_seats")
        .select("id, seat_code, section, row_number, seat_in_row, sort_order")
        .in("section", [section, section.toLowerCase()])
        .order("sort_order", { ascending: true })
    ),
  ]);

  const takenIds = new Set((takenRes.data ?? []).map((r) => (r as { seat_id: string }).seat_id));
  const taraftarSold = (taraftarRes.data ?? []).length;

  type SeatRow = { id: string; seat_code: string; section: string | null; row_number: number; seat_in_row: number; sort_order: number };
  const allRows: SeatRow[] = [];
  for (let i = 0; i < SECTIONS.length; i++) {
    const res = sectionResults[i];
    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }
    const rows = (res.data ?? []) as SeatRow[];
    allRows.push(...rows);
  }
  allRows.sort((a, b) => a.sort_order - b.sort_order);

  const seats = allRows.map((s) => ({
    id: s.id,
    seat_code: s.seat_code,
    section: (s.section ?? "").trim().toUpperCase() || s.section,
    row_number: s.row_number,
    seat_in_row: s.seat_in_row,
  }));

  return NextResponse.json({
    seats,
    takenIds: Array.from(takenIds),
    taraftarCapacity: TARAFTAR_CAPACITY,
    taraftarSold,
  });
}
