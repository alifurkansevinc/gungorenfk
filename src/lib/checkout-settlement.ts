import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm, retrievePaymentRefundStatus } from "@/lib/iyzico";
import { restoreStockForOrder, reverseFanStoreSpendForOrder } from "@/lib/order-refund";
import { closeOpenServiceRequests } from "@/lib/order-service";
import { completedRefundTotal } from "@/lib/store-spend";
import { roundMoney } from "@/lib/order-stock";
import { checkAndLevelUp } from "@/lib/fan-level";
import { interpretCheckoutResult, isCheckoutToken } from "@/lib/iyzico-result";
import { cancelInvoiceForRefundedOrder } from "@/lib/uyum-invoice";
import { sendOrderStatusEmail } from "@/lib/order-emails";

export type CheckoutSettlement = {
  outcome: "paid" | "already_paid" | "failed" | "pending" | "query_error" | "not_found";
  message?: string;
  redirectPath?: string;
};

type OrderRow = {
  id: string;
  order_number: string;
  notes: string | null;
  user_id: string | null;
  total: number;
  guest_email: string | null;
  receipt_token: string | null;
  payment_status: string;
  status: string;
  payment_id: string | null;
};

type DonationRow = {
  id: string;
  user_id: string | null;
  amount: number;
  payment_status: string;
};

type TicketRow = {
  id: string;
  user_id: string | null;
  match_id: string | null;
  event_id: string | null;
  qr_code: string;
  seat_id: string | null;
  payment_status: string;
};

function errorPath(base: string, message: string): string {
  return `${base}?error=${encodeURIComponent(message)}`;
}

function orderSuccessPath(order: { order_number: string; receipt_token: string | null }, levelUp: boolean, newLevelId?: number): string {
  const tokenParam = order.receipt_token ? `&token=${encodeURIComponent(order.receipt_token)}` : "";
  if (levelUp && newLevelId) {
    return `/odeme/basarili?orderNumber=${order.order_number}&levelUp=1&newLevel=${newLevelId}${tokenParam}`;
  }
  return `/odeme/basarili?orderNumber=${order.order_number}${tokenParam}`;
}

function donationSuccessPath(id: string, levelUp: boolean, newLevelId?: number): string {
  if (levelUp && newLevelId) return `/bagis/basarili?id=${id}&levelUp=1&newLevel=${newLevelId}`;
  return `/bagis/basarili?id=${id}`;
}

async function ticketSuccessPath(
  supabase: SupabaseClient,
  ticket: TicketRow,
  levelUp: boolean,
  newLevelId?: number
): Promise<string> {
  const params = new URLSearchParams({ qrCode: ticket.qr_code });
  if (ticket.event_id) params.set("type", "event");
  if (ticket.seat_id) {
    const { data: seat } = await supabase.from("stadium_seats").select("seat_code").eq("id", ticket.seat_id).maybeSingle();
    if (seat?.seat_code) params.set("seatCode", seat.seat_code);
  }
  if (levelUp && newLevelId) {
    params.set("levelUp", "1");
    params.set("newLevel", String(newLevelId));
  }
  return `/biletler/basarili?${params.toString()}`;
}

async function findOrder(supabase: SupabaseClient, token: string): Promise<OrderRow | null> {
  const columns = "id, order_number, notes, user_id, total, guest_email, receipt_token, payment_status, status, payment_id";
  const { data: byPayment } = await supabase.from("orders").select(columns).eq("payment_id", token).maybeSingle();
  if (byPayment) return byPayment as OrderRow;
  const pattern = `%iyzico token: ${token.replace(/[%_\\]/g, (ch) => `\\${ch}`)}%`;
  const { data: byNotes } = await supabase.from("orders").select(columns).ilike("notes", pattern).maybeSingle();
  return (byNotes as OrderRow | null) ?? null;
}

async function decrementStock(supabase: SupabaseClient, orderId: string): Promise<void> {
  const { data: orderItems } = await supabase.from("order_items").select("product_id, size, quantity").eq("order_id", orderId);
  for (const item of orderItems ?? []) {
    const productId = (item as { product_id: string }).product_id;
    const size = ((item as { size: string | null }).size ?? "tek_beden").trim() || "tek_beden";
    const qty = Math.max(1, Number((item as { quantity: number }).quantity) || 1);
    const { data: prod } = await supabase.from("store_products").select("stock_by_size").eq("id", productId).single();
    if (!prod) continue;
    const stock = (prod.stock_by_size as Record<string, number> | null) ?? {};
    const current = Math.max(0, Number(stock[size]) || 0);
    const nextStock = { ...stock, [size]: Math.max(0, current - qty) };
    await supabase
      .from("store_products")
      .update({ stock_by_size: nextStock, updated_at: new Date().toISOString() })
      .eq("id", productId);
  }
}

async function addStoreSpend(supabase: SupabaseClient, order: OrderRow): Promise<string | null> {
  const orderTotal = Number(order.total) || 0;
  if (orderTotal <= 0) return null;
  if (order.user_id) {
    const { data: profile } = await supabase
      .from("fan_profiles")
      .select("id, store_spend_total")
      .eq("user_id", order.user_id)
      .maybeSingle();
    if (!profile) return null;
    const newTotal = (Number(profile.store_spend_total) || 0) + orderTotal;
    await supabase
      .from("fan_profiles")
      .update({ store_spend_total: newTotal, updated_at: new Date().toISOString() })
      .eq("id", profile.id);
    return order.user_id;
  }
  const guestEmail = order.guest_email?.trim();
  if (!guestEmail) return null;
  const { data: profileByEmail } = await supabase
    .from("fan_profiles")
    .select("id, user_id, store_spend_total")
    .eq("email", guestEmail)
    .maybeSingle();
  if (!profileByEmail) return null;
  const newTotal = (Number(profileByEmail.store_spend_total) || 0) + orderTotal;
  await supabase
    .from("fan_profiles")
    .update({ store_spend_total: newTotal, updated_at: new Date().toISOString() })
    .eq("id", profileByEmail.id);
  return (profileByEmail.user_id as string | null) ?? null;
}

async function settleOrder(
  supabase: SupabaseClient,
  order: OrderRow,
  token: string,
  paymentId: string | undefined,
  interpreted: ReturnType<typeof interpretCheckoutResult>,
  errorMessage: string | undefined,
  markFailure: boolean
): Promise<CheckoutSettlement> {
  if (order.payment_status === "PAID" || order.payment_status === "REFUNDED") {
    return { outcome: "already_paid", redirectPath: orderSuccessPath(order, false) };
  }
  if (interpreted === "paid") {
    const nextStatus = order.status === "PENDING" || order.status === "CANCELLED" ? "PROCESSING" : order.status;
    const iyziPaymentId = paymentId || order.payment_id || token;
    const { data: claimed } = await supabase
      .from("orders")
      .update({
        status: nextStatus,
        payment_status: "PAID",
        payment_id: iyziPaymentId,
        notes: `${order.notes || ""}\niyzico paymentId: ${iyziPaymentId}\n[ODEME] ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .in("payment_status", ["PENDING", "FAILED"])
      .select("id");
    if (!claimed?.length) {
      return { outcome: "already_paid", redirectPath: orderSuccessPath(order, false) };
    }
    await decrementStock(supabase, order.id);
    const userId = await addStoreSpend(supabase, order);
    let levelUp = false;
    let newLevelId: number | undefined;
    if (userId) {
      const levelResult = await checkAndLevelUp(userId);
      levelUp = levelResult.leveledUp;
      newLevelId = levelResult.newLevelId;
    }
    await sendOrderStatusEmail(supabase, order.id, "paid");
    return { outcome: "paid", redirectPath: orderSuccessPath(order, levelUp, newLevelId) };
  }
  if (interpreted === "failed" && markFailure) {
    const message = errorMessage || "Ödeme başarısız.";
    await supabase
      .from("orders")
      .update({
        status: "CANCELLED",
        payment_status: "FAILED",
        notes: `${order.notes || ""}\niyzico error: ${message}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("payment_status", "PENDING");
    return { outcome: "failed", message, redirectPath: errorPath("/odeme/hata", message) };
  }
  if (interpreted === "query_error") {
    const message = "Ödeme sonucu iyzico'dan doğrulanamadı. Ödeme alındıysa sipariş kısa sürede güncellenecek.";
    return { outcome: "query_error", message, redirectPath: errorPath("/odeme/hata", message) };
  }
  const message = "Ödeme sonucu bekleniyor. Onaylandığında sipariş güncellenecek.";
  return { outcome: "pending", message, redirectPath: errorPath("/odeme/hata", message) };
}

async function settleDonation(
  supabase: SupabaseClient,
  donation: DonationRow,
  token: string,
  paymentId: string | undefined,
  interpreted: ReturnType<typeof interpretCheckoutResult>,
  errorMessage: string | undefined,
  markFailure: boolean
): Promise<CheckoutSettlement> {
  if (donation.payment_status === "PAID" || donation.payment_status === "REFUNDED") {
    return { outcome: "already_paid", redirectPath: donationSuccessPath(donation.id, false) };
  }
  if (interpreted === "paid") {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("donations")
      .select("id", { count: "exact", head: true })
      .eq("payment_status", "PAID")
      .gte("created_at", `${year}-01-01`)
      .lt("created_at", `${year + 1}-01-01`);
    const receiptNumber = `BAGIS-${year}-${String((count ?? 0) + 1).padStart(5, "0")}`;
    const { data: claimed } = await supabase
      .from("donations")
      .update({
        payment_status: "PAID",
        payment_id: paymentId || token,
        receipt_number: receiptNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("id", donation.id)
      .in("payment_status", ["PENDING", "FAILED"])
      .select("id");
    if (!claimed?.length) {
      return { outcome: "already_paid", redirectPath: donationSuccessPath(donation.id, false) };
    }
    let levelUp = false;
    let newLevelId: number | undefined;
    if (donation.user_id) {
      const { data: profile } = await supabase
        .from("fan_profiles")
        .select("id, donation_total")
        .eq("user_id", donation.user_id)
        .maybeSingle();
      if (profile) {
        const newTotal = (Number(profile.donation_total) || 0) + (Number(donation.amount) || 0);
        await supabase
          .from("fan_profiles")
          .update({ donation_total: newTotal, updated_at: new Date().toISOString() })
          .eq("id", profile.id);
        const levelResult = await checkAndLevelUp(donation.user_id);
        levelUp = levelResult.leveledUp;
        newLevelId = levelResult.newLevelId;
      }
    }
    return { outcome: "paid", redirectPath: donationSuccessPath(donation.id, levelUp, newLevelId) };
  }
  if (interpreted === "failed" && markFailure) {
    const message = errorMessage || "Ödeme başarısız.";
    await supabase
      .from("donations")
      .update({ payment_status: "FAILED", updated_at: new Date().toISOString() })
      .eq("id", donation.id)
      .eq("payment_status", "PENDING");
    return { outcome: "failed", message, redirectPath: errorPath("/bagis/hata", message) };
  }
  if (interpreted === "query_error") {
    const message = "Ödeme sonucu iyzico'dan doğrulanamadı. Ödeme alındıysa bağış kısa sürede güncellenecek.";
    return { outcome: "query_error", message, redirectPath: errorPath("/bagis/hata", message) };
  }
  const message = "Ödeme sonucu bekleniyor. Onaylandığında bağış güncellenecek.";
  return { outcome: "pending", message, redirectPath: errorPath("/bagis/hata", message) };
}

async function settleTicket(
  supabase: SupabaseClient,
  ticket: TicketRow,
  interpreted: ReturnType<typeof interpretCheckoutResult>,
  errorMessage: string | undefined,
  markFailure: boolean
): Promise<CheckoutSettlement> {
  if (ticket.payment_status === "PAID") {
    return { outcome: "already_paid", redirectPath: await ticketSuccessPath(supabase, ticket, false) };
  }
  if (interpreted === "paid") {
    const { data: claimed } = await supabase
      .from("match_tickets")
      .update({ payment_status: "PAID" })
      .eq("id", ticket.id)
      .in("payment_status", ["PENDING", "FAILED"])
      .select("id");
    if (!claimed?.length) {
      return { outcome: "already_paid", redirectPath: await ticketSuccessPath(supabase, ticket, false) };
    }
    let levelUp = false;
    let newLevelId: number | undefined;
    if (ticket.user_id && ticket.match_id) {
      const { count: paidForMatch } = await supabase
        .from("match_tickets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", ticket.user_id)
        .eq("match_id", ticket.match_id)
        .eq("payment_status", "PAID");
      if ((paidForMatch ?? 0) === 1) {
        const { data: profile } = await supabase
          .from("fan_profiles")
          .select("id, match_tickets_count")
          .eq("user_id", ticket.user_id)
          .maybeSingle();
        if (profile) {
          const newCount = (Number(profile.match_tickets_count) || 0) + 1;
          await supabase
            .from("fan_profiles")
            .update({ match_tickets_count: newCount, updated_at: new Date().toISOString() })
            .eq("id", profile.id);
        }
      }
      const levelResult = await checkAndLevelUp(ticket.user_id);
      levelUp = levelResult.leveledUp;
      newLevelId = levelResult.newLevelId;
    }
    return { outcome: "paid", redirectPath: await ticketSuccessPath(supabase, ticket, levelUp, newLevelId) };
  }
  if (interpreted === "failed" && markFailure) {
    const message = errorMessage || "Ödeme başarısız.";
    await supabase.from("match_tickets").update({ payment_status: "FAILED" }).eq("id", ticket.id).eq("payment_status", "PENDING");
    return { outcome: "failed", message, redirectPath: errorPath("/biletler/hata", message) };
  }
  if (interpreted === "query_error") {
    const message = "Ödeme sonucu iyzico'dan doğrulanamadı. Ödeme alındıysa bilet kısa sürede güncellenecek.";
    return { outcome: "query_error", message, redirectPath: errorPath("/biletler/hata", message) };
  }
  const message = "Ödeme sonucu bekleniyor. Onaylandığında bilet güncellenecek.";
  return { outcome: "pending", message, redirectPath: errorPath("/biletler/hata", message) };
}

/**
 * Checkout token ile iyzico sonucunu sorgular ve sipariş / bağış / bileti bir kez günceller.
 * markFailure false ise henüz ödenmemiş kayıt FAILED yapılmaz (paneldeki yeniden sorgulama).
 */
export async function applyCheckoutToken(token: string, options?: { markFailure?: boolean }): Promise<CheckoutSettlement> {
  if (!isCheckoutToken(token)) return { outcome: "not_found", message: "Geçersiz ödeme jetonu." };
  const markFailure = options?.markFailure !== false;
  const supabase = createServiceRoleClient();

  const order = await findOrder(supabase, token);
  const { data: donation } = order
    ? { data: null }
    : await supabase.from("donations").select("id, user_id, amount, payment_status").eq("payment_token", token).maybeSingle();
  const { data: ticket } = order || donation
    ? { data: null }
    : await supabase
        .from("match_tickets")
        .select("id, user_id, match_id, event_id, qr_code, seat_id, payment_status")
        .eq("payment_token", token)
        .maybeSingle();

  if (!order && !donation && !ticket) return { outcome: "not_found", message: "Kayıt bulunamadı." };

  let retrieved: { status?: string; paymentStatus?: string; paymentId?: string; errorMessage?: string };
  try {
    retrieved = await retrieveCheckoutForm(token);
  } catch (err) {
    console.error("iyzico retrieve error:", err);
    const message = "Ödeme sonucu iyzico'dan doğrulanamadı. Ödeme alındıysa kayıt kısa sürede güncellenecek.";
    const base = order ? "/odeme/hata" : donation ? "/bagis/hata" : "/biletler/hata";
    return { outcome: "query_error", message, redirectPath: errorPath(base, message) };
  }

  const interpreted = interpretCheckoutResult(retrieved);
  if (interpreted === "query_error") {
    console.error("iyzico retrieve query error:", retrieved.status, retrieved.errorMessage);
  }

  if (order) {
    return settleOrder(supabase, order, token, retrieved.paymentId, interpreted, retrieved.errorMessage, markFailure);
  }
  if (donation) {
    return settleDonation(
      supabase,
      donation as DonationRow,
      token,
      retrieved.paymentId,
      interpreted,
      retrieved.errorMessage,
      markFailure
    );
  }
  return settleTicket(supabase, ticket as TicketRow, interpreted, retrieved.errorMessage, markFailure);
}

/** Bekleyen iyzico kayıtlarını yeniden sorgular. Yalnızca SUCCESS olanları ödendi yapar. */
export async function reconcilePendingIyzicoPayments(kind: "order" | "donation" | "ticket" | "all" = "all"): Promise<{ checked: number; paid: number }> {
  const supabase = createServiceRoleClient();
  const tokens: string[] = [];

  if (kind === "order" || kind === "all") {
    const { data } = await supabase
      .from("orders")
      .select("payment_id")
      .eq("payment_status", "PENDING")
      .eq("payment_method", "iyzico")
      .not("payment_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(15);
    for (const row of data ?? []) {
      const token = (row as { payment_id: string | null }).payment_id;
      if (token && isCheckoutToken(token)) tokens.push(token);
    }
  }
  if (kind === "donation" || kind === "all") {
    const { data } = await supabase
      .from("donations")
      .select("payment_token")
      .eq("payment_status", "PENDING")
      .not("payment_token", "is", null)
      .order("created_at", { ascending: true })
      .limit(5);
    for (const row of data ?? []) {
      const token = (row as { payment_token: string | null }).payment_token;
      if (token && isCheckoutToken(token)) tokens.push(token);
    }
  }
  if (kind === "ticket" || kind === "all") {
    const { data } = await supabase
      .from("match_tickets")
      .select("payment_token")
      .eq("payment_status", "PENDING")
      .not("payment_token", "is", null)
      .order("created_at", { ascending: true })
      .limit(5);
    for (const row of data ?? []) {
      const token = (row as { payment_token: string | null }).payment_token;
      if (token && isCheckoutToken(token)) tokens.push(token);
    }
  }

  let paid = 0;
  for (const token of tokens) {
    try {
      const result = await applyCheckoutToken(token, { markFailure: false });
      if (result.outcome === "paid") paid += 1;
    } catch (err) {
      console.error("iyzico reconcile error:", err);
    }
  }
  return { checked: tokens.length, paid };
}

/** Süresi dolmak üzere olan bekleyen siparişlerin tamamını iyzico'dan doğrular. */
export async function reconcilePendingOrdersDue(cutoffIso: string): Promise<{ checked: number; paid: number }> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("orders")
    .select("payment_id")
    .eq("payment_status", "PENDING")
    .eq("payment_method", "iyzico")
    .lt("created_at", cutoffIso)
    .not("payment_id", "is", null);
  const tokens: string[] = [];
  for (const row of data ?? []) {
    const token = (row as { payment_id: string | null }).payment_id;
    if (token && isCheckoutToken(token)) tokens.push(token);
  }
  let paid = 0;
  for (const token of tokens) {
    try {
      const result = await applyCheckoutToken(token, { markFailure: false });
      if (result.outcome === "paid") paid += 1;
    } catch (err) {
      console.error("iyzico reconcile due error:", err);
    }
  }
  return { checked: tokens.length, paid };
}

/**
 * iyzico panelinden yapılan tam iadeleri mağaza siparişine yazar.
 * Site butonu kullanılmadan iade edilince kayıt PAID kalıyordu.
 */
export async function syncIyzicoPanelRefunds(): Promise<{ checked: number; refunded: number }> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("id, notes, user_id, guest_email, total, payment_id")
    .eq("payment_status", "PAID")
    .eq("payment_method", "iyzico")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(40);

  let refunded = 0;
  for (const row of data ?? []) {
    const paymentId = String((row as { payment_id: string | null }).payment_id || "").trim();
    if (!/^\d+$/.test(paymentId)) continue;
    try {
      const report = await retrievePaymentRefundStatus(paymentId);
      if (report.paymentRefundStatus !== "TOTALLY_REFUNDED") continue;
      const order = row as { id: string; notes: string | null; user_id: string | null; guest_email: string | null; total: number };
      const note = `\n[İADE ${new Date().toISOString()}] iyzico panelinden tam iade`;
      const { data: claimed } = await supabase
        .from("orders")
        .update({
          payment_status: "REFUNDED",
          status: "CANCELLED",
          notes: `${order.notes || ""}${note}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("payment_status", "PAID")
        .select("id");
      if (!claimed?.length) continue;
      const stock = await restoreStockForOrder(supabase, order.id);
      if (!stock.ok) console.error("iyzico panel iadesi stok:", stock.error);
      const already = await completedRefundTotal(supabase, order.id);
      const refundedBefore = already.ok ? already.amount : Number(order.total);
      const remaining = Math.max(0, roundMoney(Number(order.total) - refundedBefore));
      if (remaining > 0) {
        await reverseFanStoreSpendForOrder(supabase, { ...order, total: remaining });
      }
      await closeOpenServiceRequests(supabase, order.id);
      await sendOrderStatusEmail(supabase, order.id, "cancelled");
      try {
        await cancelInvoiceForRefundedOrder(order.id);
      } catch (err) {
        console.error("Uyum fatura iptal:", err);
      }
      refunded += 1;
    } catch (err) {
      console.error("iyzico panel iade sorgusu:", err);
    }
  }
  return { checked: data?.length ?? 0, refunded };
}
