import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { initializeCheckoutForm, type PaymentRequest, type CartItemForIyzico } from "@/lib/iyzico";

const DEFAULT_SHIPPING_COST = 29.9;
const DEFAULT_FREE_THRESHOLD = 500;

function generatePickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return d;
}

function formatDateForDB(d: Date): string {
  return d.toISOString().slice(0, 10);
}

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
    const { userId, email, items, shippingAddress, deliveryMethod: rawDeliveryMethod } = body as {
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
      deliveryMethod?: "shipping" | "store_pickup";
    };

    const deliveryMethod = rawDeliveryMethod === "store_pickup" ? "store_pickup" : "shipping";

    if (!items?.length) {
      return NextResponse.json({ success: false, error: "Sepetinizde ürün yok." }, { status: 400 });
    }
    if (deliveryMethod === "shipping" && (!shippingAddress?.city || (!shippingAddress?.address && !shippingAddress?.addressLine))) {
      return NextResponse.json({ success: false, error: "Teslimat adresi gereklidir." }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data: settingsRow } = await supabase.from("site_settings").select("value").eq("key", "shipping").single();
    const settings = (settingsRow?.value as { freeShippingThreshold?: number; standardShippingCost?: number }) ?? {};
    const freeThreshold = Number(settings.freeShippingThreshold) || DEFAULT_FREE_THRESHOLD;
    const standardShipping = Number(settings.standardShippingCost) ?? DEFAULT_SHIPPING_COST;

    const subtotal = items.reduce((sum: number, i: { price: number; quantity: number }) => sum + i.price * i.quantity, 0);
    const shippingCost = deliveryMethod === "store_pickup" ? 0 : (subtotal >= freeThreshold ? 0 : standardShipping);
    const total = subtotal + shippingCost;

    const now = new Date();
    const pickupDate = deliveryMethod === "store_pickup" ? formatDateForDB(addBusinessDays(now, 3)) : null;
    let pickupCode: string | null = null;
    if (deliveryMethod === "store_pickup") {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generatePickupCode();
        const { data: existing } = await supabase.from("orders").select("id").eq("pickup_code", code).maybeSingle();
        if (!existing) {
          pickupCode = code;
          break;
        }
      }
      if (!pickupCode) pickupCode = generatePickupCode() + Date.now().toString(36).slice(-2);
    }

    const orderNumber = generateOrderNumber();
    const fullName = shippingAddress?.fullName || "Müşteri";
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "Müşteri";
    const lastName = nameParts.slice(1).join(" ") || "Müşteri";
    const address = deliveryMethod === "store_pickup"
      ? "Güngören Store - Mağazadan teslim alacak"
      : (shippingAddress?.address || shippingAddress?.addressLine || "");
    const zipCode = shippingAddress?.zipCode || shippingAddress?.postalCode || "34000";
    const phone = (shippingAddress?.phone || "").replace(/\s/g, "") || "0000000000";
    const shipCity = deliveryMethod === "store_pickup" ? "İstanbul" : (shippingAddress?.city || "İstanbul");
    const district = shippingAddress?.district || "";
    const neighborhood = shippingAddress?.neighborhood || "";

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        user_id: userId || null,
        guest_email: !userId ? (email || shippingAddress?.email) : null,
        guest_name: !userId ? fullName : null,
        guest_phone: !userId ? phone : null,
        shipping_address: deliveryMethod === "store_pickup"
          ? { fullName, email: email || shippingAddress?.email, phone, city: shipCity, address: "Mağazadan teslim", zipCode }
          : {
              fullName,
              email: email || shippingAddress?.email,
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
        delivery_method: deliveryMethod,
        pickup_date: pickupDate,
        pickup_code: pickupCode,
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
