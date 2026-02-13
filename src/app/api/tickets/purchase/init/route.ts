import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initializeCheckoutForm } from "@/lib/iyzico";

const TICKET_PRICE = 50;

function generateQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TKT";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId } = body as { matchId?: string };
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

    let qrCode = generateQrCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data: existing } = await supabase.from("match_tickets").select("id").eq("qr_code", qrCode).maybeSingle();
      if (!existing) break;
      qrCode = generateQrCode();
    }

    const guestEmail = user ? null : (body.email as string)?.trim() || null;
    const guestName = (user ? null : (body.name as string)?.trim() || "Bilet alıcı") ?? "Bilet alıcı";

    const { data: ticket, error: insertError } = await supabase
      .from("match_tickets")
      .insert({
        match_id: matchId,
        user_id: user?.id ?? null,
        guest_email: guestEmail,
        guest_name: guestName,
        qr_code: qrCode,
        status: "active",
        payment_status: "PENDING",
      })
      .select("id")
      .single();

    if (insertError || !ticket) {
      console.error("Ticket insert error:", insertError);
      return NextResponse.json({ success: false, error: "Bilet kaydı oluşturulamadı." }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
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
