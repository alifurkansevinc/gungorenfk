import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Sipariş numarası ile makbuz. Erişim: token eşleşmesi veya sipariş sahibi (user_id). */
export async function GET(req: NextRequest) {
  const orderNumber = req.nextUrl.searchParams.get("orderNumber")?.trim();
  const token = req.nextUrl.searchParams.get("token")?.trim() ?? null;
  if (!orderNumber) {
    return NextResponse.json({ success: false, error: "orderNumber gerekli" }, { status: 400 });
  }
  const supabase = createServiceRoleClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total, subtotal, shipping_cost, delivery_method, pickup_date, pickup_code, created_at, payment_status, shipping_address, guest_name, guest_email, user_id, receipt_token")
    .eq("order_number", orderNumber)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ success: false, error: "Sipariş bulunamadı" }, { status: 404 });
  }
  if (order.payment_status !== "PAID") {
    return NextResponse.json({ success: false, error: "Sipariş henüz ödenmedi" }, { status: 400 });
  }

  const hasTokenAccess = token && order.receipt_token && order.receipt_token === token;
  let hasOwnerAccess = false;
  if (!hasTokenAccess) {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    hasOwnerAccess = !!(user && order.user_id === user.id);
  }
  if (!hasTokenAccess && !hasOwnerAccess) {
    return NextResponse.json({ success: false, error: "Bu siparişe erişim yetkiniz yok" }, { status: 403 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("name, price, quantity")
    .eq("order_id", order.id)
    .order("created_at");

  return NextResponse.json({
    success: true,
    data: {
      orderNumber: order.order_number,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      deliveryMethod: order.delivery_method,
      pickupDate: order.pickup_date,
      pickupCode: order.pickup_code,
      createdAt: order.created_at,
      shippingAddress: order.shipping_address,
      guestName: order.guest_name,
      guestEmail: order.guest_email,
      items: (items ?? []).map((i) => ({
        name: i.name,
        price: Number(i.price),
        quantity: i.quantity,
      })),
    },
  });
}
