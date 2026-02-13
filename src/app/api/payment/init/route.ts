import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initializeCheckoutForm, type PaymentRequest, type CartItemForIyzico } from "@/lib/iyzico";

const DEFAULT_SHIPPING_COST = 29.9;
const DEFAULT_FREE_THRESHOLD = 500;

function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const r = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `GFK${y}${m}${day}${r}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email, items, shippingAddress } = body as {
      userId?: string | null;
      email: string;
      items: Array<{ id: string; productId?: string; name: string; price: number; quantity: number; category?: string }>;
      shippingAddress: {
        fullName?: string;
        email?: string;
        phone?: string;
        city?: string;
        district?: string;
        neighborhood?: string;
        address?: string;
        addressLine?: string;
        zipCode?: string;
        postalCode?: string;
      };
    };

    if (!items?.length) {
      return NextResponse.json({ success: false, error: "Sepetinizde ürün yok." }, { status: 400 });
    }
    if (!shippingAddress?.city || !shippingAddress?.address && !shippingAddress?.addressLine) {
      return NextResponse.json({ success: false, error: "Teslimat adresi gereklidir." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: settingsRow } = await supabase.from("site_settings").select("value").eq("key", "shipping").single();
    const settings = (settingsRow?.value as { freeShippingThreshold?: number; standardShippingCost?: number }) ?? {};
    const freeThreshold = Number(settings.freeShippingThreshold) || DEFAULT_FREE_THRESHOLD;
    const standardShipping = Number(settings.standardShippingCost) ?? DEFAULT_SHIPPING_COST;

    const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);
    const shippingCost = subtotal >= freeThreshold ? 0 : standardShipping;
    const total = subtotal + shippingCost;

    const orderNumber = generateOrderNumber();
    const fullName = shippingAddress.fullName || "Müşteri";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Müşteri";
    const lastName = nameParts.slice(1).join(" ") || "Müşteri";
    const address = shippingAddress.address || shippingAddress.addressLine || "";
    const zipCode = shippingAddress.zipCode || shippingAddress.postalCode || "34000";
    const phone = (shippingAddress.phone || "").replace(/\s/g, "");
    const shipCity = shippingAddress.city || "İstanbul";
    const district = shippingAddress.district || "";
    const neighborhood = shippingAddress.neighborhood || "";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        guest_email: !userId ? (email || shippingAddress.email) : null,
        guest_name: !userId ? fullName : null,
        guest_phone: !userId ? phone : null,
        shipping_address: {
          fullName,
          email: email || shippingAddress.email,
          phone,
          city: shipCity,
          district,
          neighborhood,
          address,
          zipCode,
        },
        subtotal,
        shipping_cost: shippingCost,
        total,
        status: "PENDING",
        payment_status: "PENDING",
        payment_method: "iyzico",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order insert error:", orderError);
      return NextResponse.json({ success: false, error: "Sipariş oluşturulamadı." }, { status: 500 });
    }

    const orderItems = items.map((i: { productId?: string; name: string; price: number; quantity: number }) => ({
      order_id: order.id,
      product_id: i.productId || null,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));
    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ success: false, error: "Sipariş kalemleri yazılamadı." }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const basketForIyzico: CartItemForIyzico[] = items.map((i: { id: string; name: string; price: number; quantity: number; category?: string }) => ({
      id: i.id,
      name: i.name,
      category: i.category,
      price: i.price,
      quantity: i.quantity,
    }));

    const paymentRequest: PaymentRequest = {
      orderId: order.id,
      orderNumber,
      price: total,
      paidPrice: total,
      shippingCost,
      buyer: {
        id: userId || `guest_${order.id}`,
        name: firstName,
        surname: lastName,
        email: email || (shippingAddress as { email?: string }).email || "musteri@gungorenfk.com",
        phone,
        registrationAddress: [neighborhood, address].filter(Boolean).join(", ") || address,
        city: shipCity,
        country: "Turkey",
        zipCode,
      },
      shippingAddress: {
        contactName: fullName,
        city: shipCity,
        district,
        address: [neighborhood, address].filter(Boolean).join(", ") || address,
        zipCode,
      },
      billingAddress: {
        contactName: fullName,
        city: shipCity,
        district,
        address: [neighborhood, address].filter(Boolean).join(", ") || address,
        zipCode,
      },
      basketItems: basketForIyzico,
      callbackUrl: `${baseUrl}/api/payment/callback`,
    };

    const result = await initializeCheckoutForm(paymentRequest);

    if (result.status === "success" && result.token) {
      await supabase.from("orders").update({ payment_id: result.token, notes: `iyzico token: ${result.token}` }).eq("id", order.id);
      return NextResponse.json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber,
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl,
        },
      });
    }

    await supabase
      .from("orders")
      .update({ status: "CANCELLED", payment_status: "FAILED", notes: `iyzico: ${result.errorMessage || "unknown"}` })
      .eq("id", order.id);
    return NextResponse.json(
      { success: false, error: result.errorMessage || "Ödeme başlatılamadı." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Payment init error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Ödeme başlatılırken hata oluştu." },
      { status: 500 }
    );
  }
}
