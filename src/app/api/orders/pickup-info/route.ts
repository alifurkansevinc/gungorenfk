import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Sipariş numarası ile mağazadan teslim bilgisi (QR + tarih). Ödeme başarılı sayfasında kullanılır. */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber");
  if (!orderNumber?.trim()) {
    return NextResponse.json({ error: "orderNumber gerekli" }, { status: 400 });
  }
  const supabase = createServiceRoleClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("delivery_method, pickup_date, pickup_code, payment_status")
    .eq("order_number", orderNumber.trim())
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order.payment_status !== "PAID") {
    return NextResponse.json({ error: "Sipariş henüz ödenmedi" }, { status: 400 });
  }
  if (order.delivery_method !== "store_pickup" || !order.pickup_code) {
    return NextResponse.json({
      success: true,
      data: { deliveryMethod: "shipping", pickupDate: null, pickupCode: null },
    });
  }
  return NextResponse.json({
    success: true,
    data: {
      deliveryMethod: "store_pickup",
      pickupDate: order.pickup_date,
      pickupCode: order.pickup_code,
    },
  });
}
