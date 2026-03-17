import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Sipariş numarası ile mağazadan teslim bilgisi (QR + tarih). Erişim: token veya sipariş sahibi. */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber")?.trim();
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? null;
  if (!orderNumber) {
    return NextResponse.json({ error: "orderNumber gerekli" }, { status: 400 });
  }
  const supabase = createServiceRoleClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("delivery_method, pickup_date, pickup_code, payment_status, user_id, receipt_token")
    .eq("order_number", orderNumber)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order.payment_status !== "PAID") {
    return NextResponse.json({ error: "Sipariş henüz ödenmedi" }, { status: 400 });
  }

  const hasTokenAccess = token && order.receipt_token && order.receipt_token === token;
  let hasOwnerAccess = false;
  if (!hasTokenAccess) {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    hasOwnerAccess = !!(user && order.user_id === user.id);
  }
  if (!hasTokenAccess && !hasOwnerAccess) {
    return NextResponse.json({ error: "Bu siparişe erişim yetkiniz yok" }, { status: 403 });
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
