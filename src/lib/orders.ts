import { createServiceRoleClient } from "@/lib/supabase/service";

export type ReceiptItem = { name: string; price: number; quantity: number };
export type ReceiptData = {
  orderNumber: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  deliveryMethod: string;
  pickupDate: string | null;
  pickupCode: string | null;
  createdAt: string;
  items: ReceiptItem[];
  guestName?: string | null;
  guestEmail?: string | null;
} | null;

/** Sipariş numarası ile makbuz verisi (sunucu tarafı; ödeme başarılı sayfası). */
export async function getReceiptByOrderNumber(orderNumber: string | null): Promise<ReceiptData> {
  if (!orderNumber?.trim()) return null;
  const supabase = createServiceRoleClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total, subtotal, shipping_cost, delivery_method, pickup_date, pickup_code, created_at, payment_status, guest_name, guest_email")
    .eq("order_number", orderNumber.trim())
    .single();

  if (orderError || !order || order.payment_status !== "PAID") return null;

  const { data: items } = await supabase
    .from("order_items")
    .select("name, price, quantity")
    .eq("order_id", order.id)
    .order("created_at");

  return {
    orderNumber: order.order_number,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shippingCost: Number(order.shipping_cost),
    deliveryMethod: order.delivery_method,
    pickupDate: order.pickup_date,
    pickupCode: order.pickup_code,
    createdAt: order.created_at,
    guestName: order.guest_name,
    guestEmail: order.guest_email,
    items: (items ?? []).map((i) => ({
      name: i.name,
      price: Number(i.price),
      quantity: i.quantity,
    })),
  };
}
