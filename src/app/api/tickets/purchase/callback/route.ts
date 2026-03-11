import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

function getBaseUrl(req: NextRequest): string {
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(new URL("/biletler/hata?error=token_missing", getBaseUrl(req)));
  }
  try {
    return await processTicketCallback(req, token);
  } catch (err) {
    console.error("Ticket callback GET error:", err);
    return NextResponse.redirect(
      new URL(`/biletler/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = (formData.get("token") as string | null)?.trim() ?? null;
    if (!token) {
      return NextResponse.redirect(new URL("/biletler/hata?error=token_missing", getBaseUrl(req)));
    }
    return await processTicketCallback(req, token);
  } catch (err) {
    console.error("Ticket callback error:", err);
    return NextResponse.redirect(
      new URL(`/biletler/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}

async function processTicketCallback(req: NextRequest, token: string): Promise<NextResponse> {
  try {
    const result = await retrieveCheckoutForm(token);
    const supabase = createServiceRoleClient();

    const { data: ticket, error: findError } = await supabase
      .from("match_tickets")
      .select("id, user_id, match_id, event_id, qr_code, seat_id")
      .eq("payment_token", token)
      .single();

    if (findError || !ticket) {
      console.error("Ticket not found for token:", token, findError);
      return NextResponse.redirect(new URL("/biletler/hata?error=bilet_bulunamadi", getBaseUrl(req)));
    }

    const base = getBaseUrl(req);

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
      if ((ticket as { event_id?: string }).event_id) {
        redirectUrl += "&type=event";
      } else if ((ticket as { seat_id?: string }).seat_id) {
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
    return NextResponse.redirect(
      new URL(`/biletler/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}
