import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initializeCheckoutForm } from "@/lib/iyzico";

const MIN_AMOUNT = 10;
const MAX_AMOUNT = 100_000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount: rawAmount, message, email: bodyEmail, name: bodyName } = body as {
      amount?: number;
      message?: string;
      email?: string;
      name?: string;
    };

    const amount = Math.round(Number(rawAmount) * 100) / 100;
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { success: false, error: `Tutar ${MIN_AMOUNT} - ${MAX_AMOUNT} ₺ arasında olmalıdır.` },
        { status: 400 }
      );
    }

    const supabaseAuth = await createClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const supabase = createServiceRoleClient();

    let email = bodyEmail?.trim() || "";
    let name = (bodyName?.trim() || "Bağışçı").trim();
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || "Bağışçı";
    const lastName = nameParts.slice(1).join(" ") || "Bağışçı";
    if (user?.email) email = user.email;

    const { data: donation, error: insertError } = await supabase
      .from("donations")
      .insert({
        user_id: user?.id ?? null,
        guest_email: user ? null : (email || null),
        guest_name: user ? null : name,
        amount,
        payment_status: "PENDING",
        message: message?.trim() || null,
      })
      .select("id")
      .single();

    if (insertError || !donation) {
      console.error("Donation insert error:", insertError);
      return NextResponse.json({ success: false, error: "Kayıt oluşturulamadı." }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const result = await initializeCheckoutForm({
      orderId: donation.id,
      orderNumber: `BAGIS-${Date.now().toString(36).toUpperCase()}`,
      price: amount,
      paidPrice: amount,
      shippingCost: 0,
      buyer: {
        id: user?.id || `guest_${donation.id}`,
        name: firstName,
        surname: lastName,
        email: email || "bagis@gungorenfk.com",
        phone: "0000000000",
        registrationAddress: "Bağış",
        city: "İstanbul",
        country: "Turkey",
        zipCode: "34000",
      },
      shippingAddress: { contactName: name, city: "İstanbul", address: "Bağış", zipCode: "34000" },
      billingAddress: { contactName: name, city: "İstanbul", address: "Bağış", zipCode: "34000" },
      basketItems: [{ id: donation.id, name: "Güngören FK Bağış", category: "Bağış", price: amount, quantity: 1 }],
      callbackUrl: `${baseUrl}/api/donation/callback`,
    });

    if (result.status === "success" && result.token) {
      await supabase
        .from("donations")
        .update({ payment_token: result.token, updated_at: new Date().toISOString() })
        .eq("id", donation.id);
      return NextResponse.json({
        success: true,
        data: {
          donationId: donation.id,
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: result.errorMessage || "Ödeme başlatılamadı." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Donation init error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Bir hata oluştu." },
      { status: 500 }
    );
  }
}
