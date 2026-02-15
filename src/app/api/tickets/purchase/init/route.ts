import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initializeCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

const TICKET_PRICE = 0;

function generateQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TKT";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, seatId } = body as { matchId?: string; seatId?: string };
    if (!matchId) return NextResponse.json({ success: false, error: "matchId gerekli" }, { status: 400 });

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const supabase = createServiceRoleClient();

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, opponent_name, match_date")
      .eq("id", matchId)
      .single();
    if (matchError || !match) {
      return NextResponse.json({ success: false, error: "Maç bulunamadı." }, { status: 404 });
    }

    if (user?.id) {
      const { data: existingTicket } = await supabase
        .from("match_tickets")
        .select("id")
        .eq("user_id", user.id)
        .eq("match_id", matchId)
        .eq("payment_status", "PAID")
        .maybeSingle();
      if (existingTicket) {
        return NextResponse.json(
          { success: false, error: "Bu maç için zaten biletiniz var. Bir maça yalnızca bir bilet alabilirsiniz." },
          { status: 400 }
        );
      }
    }

    let qrCode = generateQrCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase.from("match_tickets").select("id").eq("qr_code", qrCode).maybeSingle();
      if (!existing) break;
      qrCode = generateQrCode();
    }

    const guestEmail = user ? null : (body.email as string)?.trim() || null;
    const guestName = (user ? null : (body.name as string)?.trim() || "Bilet alıcı") ?? "Bilet alıcı";

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const isFree = TICKET_PRICE === 0;

    const { data: takenSeats } = await supabase
      .from("match_tickets")
      .select("seat_id")
      .eq("match_id", matchId)
      .not("seat_id", "is", null);
    const takenIds = new Set((takenSeats ?? []).map((r) => (r as { seat_id: string }).seat_id).filter(Boolean));

    let seat: { id: string; seat_code: string } | null = null;
    if (seatId) {
      const { data: chosen } = await supabase.from("stadium_seats").select("id, seat_code").eq("id", seatId).single();
      if (!chosen || takenIds.has(chosen.id)) {
        return NextResponse.json(
          { success: false, error: "Seçilen koltuk artık müsait değil. Lütfen başka koltuk seçin." },
          { status: 400 }
        );
      }
      seat = chosen;
    }
    if (!seat) {
      const { data: allSeats } = await supabase
        .from("stadium_seats")
        .select("id, seat_code")
        .order("sort_order", { ascending: true });
      seat = (allSeats ?? []).find((s) => !takenIds.has(s.id)) ?? null;
    }
    if (!seat) {
      return NextResponse.json(
        { success: false, error: "Bu maç için koltuk kalmadı." },
        { status: 400 }
      );
    }

    const { data: ticket, error: insertError } = await supabase
      .from("match_tickets")
      .insert({
        match_id: matchId,
        user_id: user?.id ?? null,
        guest_email: guestEmail,
        guest_name: guestName,
        qr_code: qrCode,
        status: "active",
        payment_status: isFree ? "PAID" : "PENDING",
        seat_id: seat.id,
      })
      .select("id")
      .single();

    if (insertError || !ticket) {
      console.error("Ticket insert error:", insertError);
      return NextResponse.json({ success: false, error: "Bilet kaydı oluşturulamadı." }, { status: 500 });
    }

    if (isFree) {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("fan_profiles")
          .select("id, match_tickets_count")
          .eq("user_id", user.id)
          .single();
        if (profile) {
          const newCount = (Number(profile.match_tickets_count) || 0) + 1;
          await supabase
            .from("fan_profiles")
            .update({ match_tickets_count: newCount, updated_at: new Date().toISOString() })
            .eq("id", profile.id);
          const levelResult = await checkAndLevelUp(user.id);
          const params = new URLSearchParams({ qrCode, seatCode: seat.seat_code });
          if (levelResult.leveledUp && levelResult.newLevelId) {
            params.set("levelUp", "1");
            params.set("newLevel", String(levelResult.newLevelId));
          }
          return NextResponse.json({
            success: true,
            data: { qrCode, seatCode: seat.seat_code, redirectUrl: `${baseUrl}/biletler/basarili?${params.toString()}` },
          });
        }
      }
      return NextResponse.json({
        success: true,
        data: { qrCode, seatCode: seat.seat_code, redirectUrl: `${baseUrl}/biletler/basarili?qrCode=${qrCode}&seatCode=${encodeURIComponent(seat.seat_code)}` },
      });
    }

    const matchLabel = `${match.opponent_name} - ${new Date(match.match_date + "T12:00:00").toLocaleDateString("tr-TR")}`;
    const result = await initializeCheckoutForm({
      orderId: ticket.id,
      orderNumber: `BLT-${qrCode}`,
      price: TICKET_PRICE,
      paidPrice: TICKET_PRICE,
      shippingCost: 0,
      buyer: {
        id: user?.id || `guest_${ticket.id}`,
        name: guestName.split(" ")[0]?.trim() || "Bilet",
        surname: guestName.split(" ").slice(1).join(" ").trim() || "Alıcı",
        email: user?.email || guestEmail || "bilet@gungorenfk.com",
        phone: "0000000000",
        registrationAddress: "Maç bileti",
        city: "İstanbul",
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: { contactName: guestName, city: "İstanbul", address: "Maç bileti", zipCode: "34000" },
      billingAddress: { contactName: guestName, city: "İstanbul", address: "Maç bileti", zipCode: "34000" },
      basketItems: [{ id: ticket.id, name: `Maç Bileti: ${matchLabel}`, category: "Bilet", price: TICKET_PRICE, quantity: 1 }],
      callbackUrl: `${baseUrl}/api/tickets/purchase/callback`,
    });

    if (result.status === "success" && result.token) {
      await supabase
        .from("match_tickets")
        .update({ payment_token: result.token })
        .eq("id", ticket.id);
      return NextResponse.json({
        success: true,
        data: {
          ticketId: ticket.id,
          qrCode,
          paymentPageUrl: result.paymentPageUrl,
        },
      });
    }

    await supabase.from("match_tickets").update({ payment_status: "FAILED" }).eq("id", ticket.id);
    return NextResponse.json(
      { success: false, error: result.errorMessage || "Ödeme başlatılamadı." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Ticket purchase init error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
