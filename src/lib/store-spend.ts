import type { SupabaseClient } from "@supabase/supabase-js";
import { roundMoney } from "@/lib/order-stock";

type PaidOrder = { id: string; total: number };

/** Ödenmiş sipariş tutarından tamamlanmış iadeleri düşer. Sorgu hata verirse brüt tutara döner. */
export async function netPaidStoreSpend(supabase: SupabaseClient, orders: PaidOrder[]): Promise<number> {
  const gross = roundMoney(orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0));
  const ids = orders.map((order) => order.id).filter(Boolean);
  if (!ids.length) return Math.max(0, gross);

  const { data, error } = await supabase
    .from("order_service_requests")
    .select("refund_amount")
    .in("order_id", ids)
    .eq("request_type", "RETURN")
    .eq("status", "TAMAMLANDI");
  if (error) return Math.max(0, gross);

  const refunded = roundMoney(
    (data ?? []).reduce((sum, row) => sum + (Number((row as { refund_amount: number | null }).refund_amount) || 0), 0)
  );
  return Math.max(0, roundMoney(gross - refunded));
}

export async function completedRefundTotal(
  supabase: SupabaseClient,
  orderId: string
): Promise<{ ok: true; amount: number } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from("order_service_requests")
    .select("refund_amount")
    .eq("order_id", orderId)
    .eq("request_type", "RETURN")
    .eq("status", "TAMAMLANDI");
  if (error) return { ok: false, error: error.message };
  const amount = roundMoney(
    (data ?? []).reduce((sum, row) => sum + (Number((row as { refund_amount: number | null }).refund_amount) || 0), 0)
  );
  return { ok: true, amount };
}
