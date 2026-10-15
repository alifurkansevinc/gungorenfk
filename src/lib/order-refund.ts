import type { SupabaseClient } from "@supabase/supabase-js";
import { adjustProductSizeStock, normalizeSize } from "@/lib/order-stock";

type StockRequestRow = {
  id: string;
  order_item_id: string;
  request_type: string;
  status: string;
  quantity: number;
  to_size: string | null;
  stock_reserved: boolean;
  old_stock_restored: boolean;
};

/**
 * Ödeme sonrası düşülen stoku iade eder.
 * Tamamlanmış iadelerde stoğu ikinci kez yazmaz.
 * Açık beden değişiminde ayrılan yeni bedeni geri açar; eski beden zaten stoğa alındıysa onu tekrar eklemez.
 */
export async function restoreStockForOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: orderItems, error: itemsErr } = await supabase
    .from("order_items")
    .select("id, product_id, size, quantity")
    .eq("order_id", orderId);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  const { data: requestRows, error: reqErr } = await supabase
    .from("order_service_requests")
    .select("id, order_item_id, request_type, status, quantity, to_size, stock_reserved, old_stock_restored")
    .eq("order_id", orderId);
  if (reqErr) return { ok: false, error: reqErr.message };
  const requests = (requestRows ?? []) as StockRequestRow[];

  for (const item of orderItems ?? []) {
    const row = item as { id: string; product_id: string | null; size: string | null; quantity: number };
    if (!row.product_id) continue;
    const itemRequests = requests.filter((request) => request.order_item_id === row.id);
    const returnedQty = itemRequests
      .filter((request) => request.request_type === "RETURN" && request.status === "TAMAMLANDI" && request.old_stock_restored)
      .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
    const originalAlreadyBack = itemRequests.some(
      (request) => request.request_type === "SIZE_EXCHANGE" && request.old_stock_restored && request.status !== "TAMAMLANDI"
    );
    if (!originalAlreadyBack) {
      const qty = Math.max(0, Number(row.quantity) - returnedQty);
      if (qty > 0) {
        const restored = await adjustProductSizeStock(supabase, row.product_id, normalizeSize(row.size), qty);
        if (!restored.ok) return restored;
      }
    }
    for (const exchange of itemRequests) {
      if (exchange.request_type !== "SIZE_EXCHANGE" || !exchange.stock_reserved || exchange.status === "TAMAMLANDI") continue;
      if (!exchange.to_size) continue;
      const released = await adjustProductSizeStock(supabase, row.product_id, exchange.to_size, Number(exchange.quantity) || 1);
      if (!released.ok) return released;
      await supabase.from("order_service_requests").update({ stock_reserved: false }).eq("id", exchange.id);
    }
  }
  return { ok: true };
}

type OrderSpendRow = {
  user_id: string | null;
  guest_email: string | null;
  total: number;
};

/**
 * Ödeme başarılı callback'te eklenen mağaza harcamasını geri alır (min 0).
 */
export async function reverseFanStoreSpendForOrder(
  supabase: SupabaseClient,
  order: OrderSpendRow
): Promise<void> {
  const orderTotal = Number(order.total) || 0;
  if (orderTotal <= 0) return;

  if (order.user_id) {
    const { data: profile } = await supabase
      .from("fan_profiles")
      .select("id, store_spend_total")
      .eq("user_id", order.user_id)
      .maybeSingle();
    if (profile) {
      const prev = Number((profile as { store_spend_total?: number }).store_spend_total) || 0;
      const next = Math.max(0, prev - orderTotal);
      await supabase
        .from("fan_profiles")
        .update({ store_spend_total: next, updated_at: new Date().toISOString() })
        .eq("id", (profile as { id: string }).id);
    }
    return;
  }

  const guestEmail = order.guest_email?.trim();
  if (!guestEmail) return;
  const { data: profileByEmail } = await supabase
    .from("fan_profiles")
    .select("id, store_spend_total")
    .eq("email", guestEmail)
    .maybeSingle();
  if (profileByEmail) {
    const prev = Number((profileByEmail as { store_spend_total?: number }).store_spend_total) || 0;
    const next = Math.max(0, prev - orderTotal);
    await supabase
      .from("fan_profiles")
      .update({ store_spend_total: next, updated_at: new Date().toISOString() })
      .eq("id", (profileByEmail as { id: string }).id);
  }
}
