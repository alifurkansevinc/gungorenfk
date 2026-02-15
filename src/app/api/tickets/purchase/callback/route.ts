import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;

    if (!token) {
      return NextResponse.redirect(new URL("/biletler/hata?error=token_missing", req.url));
    }

    const result = await retrieveCheckoutForm(token);
    const supabase = createServiceRoleClient();

    const { data: ticket, error: findError } = await supabase
      .from("match_tickets")
      .select("id, user_id, match_id, qr_code, seat_id")
      .eq("payment_token", token)
      .single();

    if (findError || !ticket) {
      console.error("Ticket not found for token:", token, findError);
      return NextResponse.redirect(new URL("/biletler/hata?error=bilet_bulunamadi", req.url));
    }

    const base = req.nextUrl.origin;

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      await supabase
        .from("match_tickets")
        .update({ payment_status: "PAID", payment_token: null })
        .eq("id", ticket.id);

      if (ticket.user_id && ticket.match_id) {
        const { count: paidForMatch } = await supabase
          .from("match_tickets")
          .select("id", { count: "exact", head: true })
          .eq("user_id", ticket.user_id)
          .eq("match_id", ticket.match_id)
          .eq("payment_status", "PAID");
        const isFirstTicketForMatch = (paidForMatch ?? 0) === 1;
        if (isFirstTicketForMatch) {
          const { data: profile } = await supabase
            .from("fan_profiles")
            .select("id, match_tickets_count")
            .eq("user_id", ticket.user_id)
            .single();
          if (profile) {
            const newCount = (Number(profile.match_tickets_count) || 0) + 1;
            await supabase
              .from("fan_profiles")
              .update({ match_tickets_count: newCount, updated_at: new Date().toISOString() })
              .eq("id", profile.id);
          }
        }
        const levelResult = await checkAndLevelUp(ticket.user_id);
        if (levelResult.leveledUp && levelResult.newLevelId) {
          const params = new URLSearchParams({ qrCode: ticket.qr_code, levelUp: "1", newLevel: String(levelResult.newLevelId) });
          if ((ticket as { seat_id?: string }).seat_id) {
            const { data: seat } = await supabase.from("stadium_seats").select("seat_code").eq("id", (ticket as { seat_id: string }).seat_id).single();
            if (seat?.seat_code) params.set("seatCode", seat.seat_code);
          }
          return NextResponse.redirect(new URL(`/biletler/basarili?${params.toString()}`, base));
        }
      }

      let redirectUrl = `/biletler/basarili?qrCode=${ticket.qr_code}`;
      if ((ticket as { seat_id?: string }).seat_id) {
        const { data: seat } = await supabase.from("stadium_seats").select("seat_code").eq("id", (ticket as { seat_id: string }).seat_id).single();
        if (seat?.seat_code) redirectUrl += `&seatCode=${encodeURIComponent(seat.seat_code)}`;
      }
      return NextResponse.redirect(new URL(redirectUrl, base));
    }

    await supabase
      .from("match_tickets")
      .update({ payment_status: "FAILED", payment_token: null })
      .eq("id", ticket.id);
    return NextResponse.redirect(
      new URL(`/biletler/hata?error=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`, base)
    );
  } catch (err) {
    console.error("Ticket callback error:", err);
    const base = req.nextUrl.origin;
    return NextResponse.redirect(
      new URL(`/biletler/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, base)
    );
  }
}
