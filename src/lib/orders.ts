import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ReceiptItem = { name: string; price: number; quantity: number; image_url?: string | null };

export type OrderWithItemsForUser = {
  orderNumber: string;
  items: { name: string; price: number; quantity: number; size: string | null; image_url: string | null }[];
  total: number;
} | null;
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

/** Sipariş numarası ile sipariş + kalemler + ürün resimleri (RLS ile sadece sahibi görebilir; Store QR sayfası için). */
export async function getOrderWithItemsForCurrentUser(orderNumber: string | null): Promise<OrderWithItemsForUser> {
  if (!orderNumber?.trim()) return null;
  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, total")
    .eq("order_number", orderNumber.trim())
    .single();

  if (orderError || !order || order.total == null) return null;

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("product_id, name, price, quantity, size")
    .eq("order_id", order.id);

  const productIds = [...new Set((orderItems ?? []).map((i) => (i as { product_id: string | null }).product_id).filter(Boolean))] as string[];
  let imageByProduct: Record<string, string | null> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase.from("store_products").select("id, image_url").in("id", productIds);
    for (const p of products ?? []) {
      const row = p as { id: string; image_url: string | null };
      imageByProduct[row.id] = row.image_url ?? null;
    }
  }

  const items = (orderItems ?? []).map((i) => {
    const row = i as { product_id: string | null; name: string; price: number; quantity: number; size?: string | null };
    return {
      name: row.name,
      price: Number(row.price),
      quantity: row.quantity,
      size: row.size ?? null,
      image_url: row.product_id ? imageByProduct[row.product_id] ?? null : null,
    };
  });

  return {
    orderNumber: order.order_number,
    items,
    total: Number(order.total),
  };
}
