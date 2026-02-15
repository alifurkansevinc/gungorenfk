import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Bilet QR kodu ile koltuk bilgisi (sadece seat_code; QR kodu bilen görüntüleyebilir). */
export async function GET(req: NextRequest) {
  const qrCode = req.nextUrl.searchParams.get("qrCode")?.trim();
  if (!qrCode) {
    return NextResponse.json({ error: "qrCode gerekli" }, { status: 400 });
  }
  const supabase = createServiceRoleClient();
  const { data: ticket, error } = await supabase
    .from("match_tickets")
    .select("id, seat_id")
    .eq("qr_code", qrCode)
    .maybeSingle();
  if (error || !ticket || !(ticket as { seat_id: string | null }).seat_id) {
    return NextResponse.json({ seatCode: null });
  }
  const { data: seat } = await supabase
    .from("stadium_seats")
    .select("seat_code")
    .eq("id", (ticket as { seat_id: string }).seat_id)
    .single();
  return NextResponse.json({ seatCode: seat?.seat_code ?? null });
}
