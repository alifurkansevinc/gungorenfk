import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Ödeme sonrası düşülen stoku iade eder (beden bazlı stock_by_size).
 */
export async function restoreStockForOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: orderItems, error: itemsErr } = await supabase
    .from("order_items")
    .select("product_id, size, quantity")
    .eq("order_id", orderId);
  if (itemsErr) return { ok: false, error: itemsErr.message };

  for (const item of orderItems ?? []) {
    const productId = (item as { product_id: string }).product_id;
    const size = ((item as { size: string | null }).size ?? "tek_beden").trim() || "tek_beden";
    const qty = Math.max(1, Number((item as { quantity: number }).quantity) || 1);
    const { data: prod, error: prodErr } = await supabase.from("store_products").select("stock_by_size").eq("id", productId).single();
    if (prodErr || !prod) continue;
    const stock = (prod.stock_by_size as Record<string, number> | null) ?? {};
    const current = Math.max(0, Number(stock[size]) || 0);
    const nextStock = { ...stock, [size]: current + qty };
    const { error: upErr } = await supabase
      .from("store_products")
      .update({ stock_by_size: nextStock, updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (upErr) return { ok: false, error: upErr.message };
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
