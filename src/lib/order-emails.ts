import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-url";

export type OrderEmailKind = "paid" | "shipped" | "delivered" | "cancelled";

type OrderMailRow = {
  id: string;
  order_number: string;
  guest_email: string | null;
  guest_name: string | null;
  user_id: string | null;
  total: number | null;
  delivery_method: string | null;
  status: string;
  payment_status: string;
  shipping_address: Record<string, unknown> | null;
  pickup_code: string | null;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTry(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
}

async function resolveCustomerEmail(
  supabase: SupabaseClient,
  order: OrderMailRow
): Promise<string | null> {
  const fromGuest = (order.guest_email || "").trim().toLowerCase();
  if (fromGuest.includes("@")) return fromGuest;

  const addr = order.shipping_address;
  const fromAddr = typeof addr?.email === "string" ? addr.email.trim().toLowerCase() : "";
  if (fromAddr.includes("@")) return fromAddr;

  if (order.user_id) {
    const { data: profile } = await supabase
      .from("fan_profiles")
      .select("email")
      .eq("user_id", order.user_id)
      .maybeSingle();
    const pe = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
    if (pe.includes("@")) return pe;

    try {
      const { data: authData } = await supabase.auth.admin.getUserById(order.user_id);
      const ae = authData.user?.email?.trim().toLowerCase() || "";
      if (ae.includes("@")) return ae;
    } catch {
      /* auth admin yoksa atla */
    }
  }
  return null;
}

function customerName(order: OrderMailRow): string {
  const fromGuest = (order.guest_name || "").trim();
  if (fromGuest) return fromGuest;
  const addr = order.shipping_address;
  if (typeof addr?.fullName === "string" && addr.fullName.trim()) return addr.fullName.trim();
  return "Değerli taraftarımız";
}

function wrapHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#7a0c14;color:#fff;padding:20px 24px;font-size:18px;font-weight:bold;">Güngören Spor</td></tr>
        <tr><td style="padding:24px;font-size:15px;line-height:1.55;">${body}</td></tr>
        <tr><td style="padding:16px 24px;font-size:12px;color:#666;border-top:1px solid #eee;">
          Bu e-posta sipariş bilgilendirmesi için otomatik gönderilmiştir.<br>
          Sorularınız için: <a href="mailto:bilgi@gungorenspor.com" style="color:#7a0c14;">bilgi@gungorenspor.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildContent(kind: OrderEmailKind, order: OrderMailRow): { subject: string; html: string; text: string } {
  const name = escapeHtml(customerName(order));
  const no = escapeHtml(order.order_number);
  const total = formatTry(Number(order.total) || 0);
  const site = getSiteUrl();
  const isPickup = order.delivery_method === "store_pickup";
  const pickupNote =
    isPickup && order.pickup_code
      ? `<p>Teslim kodunuz: <strong>${escapeHtml(order.pickup_code)}</strong></p>`
      : "";

  if (kind === "paid") {
    const subject = `Siparişiniz alındı — ${order.order_number}`;
    const deliveryLine = isPickup
      ? "Siparişiniz hazırlandığında mağazadan teslim alabilirsiniz."
      : "Siparişiniz hazırlanıyor; kargoya verildiğinde bilgilendirileceksiniz.";
    const body = `
      <p>Merhaba ${name},</p>
      <p><strong>${no}</strong> numaralı siparişinizin ödemesi alındı.</p>
      <p>Tutar: <strong>${escapeHtml(total)}</strong></p>
      <p>${deliveryLine}</p>
      ${pickupNote}
      <p><a href="${escapeHtml(site)}" style="color:#7a0c14;">gungorenspor.com</a></p>
    `;
    return {
      subject,
      html: wrapHtml(subject, body),
      text: `Siparişiniz alındı (${order.order_number}). Tutar: ${total}. ${deliveryLine}`,
    };
  }

  if (kind === "shipped") {
    const subject = `Siparişiniz kargoda — ${order.order_number}`;
    const body = isPickup
      ? `
      <p>Merhaba ${name},</p>
      <p><strong>${no}</strong> numaralı siparişiniz mağazadan teslime hazır.</p>
      ${pickupNote}
      <p>Tutar: <strong>${escapeHtml(total)}</strong></p>
    `
      : `
      <p>Merhaba ${name},</p>
      <p><strong>${no}</strong> numaralı siparişiniz kargoya verildi.</p>
      <p>Tutar: <strong>${escapeHtml(total)}</strong></p>
      <p>Teslimat sürecini takip edebilirsiniz; sorularınız için bilgi@gungorenspor.com adresine yazabilirsiniz.</p>
    `;
    return {
      subject,
      html: wrapHtml(subject, body),
      text: isPickup
        ? `Siparişiniz teslime hazır (${order.order_number}).`
        : `Siparişiniz kargoda (${order.order_number}).`,
    };
  }

  if (kind === "delivered") {
    const subject = `Siparişiniz teslim edildi — ${order.order_number}`;
    const body = `
      <p>Merhaba ${name},</p>
      <p><strong>${no}</strong> numaralı siparişiniz teslim edildi olarak işaretlendi.</p>
      <p>Tutar: <strong>${escapeHtml(total)}</strong></p>
      <p>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
    `;
    return {
      subject,
      html: wrapHtml(subject, body),
      text: `Siparişiniz teslim edildi (${order.order_number}).`,
    };
  }

  const subject = `Sipariş iptali — ${order.order_number}`;
  const body = `
    <p>Merhaba ${name},</p>
    <p><strong>${no}</strong> numaralı siparişiniz iptal edildi${order.payment_status === "REFUNDED" ? " / iade edildi" : ""}.</p>
    <p>Tutar: <strong>${escapeHtml(total)}</strong></p>
    <p>Sorularınız için <a href="mailto:bilgi@gungorenspor.com" style="color:#7a0c14;">bilgi@gungorenspor.com</a> adresine yazabilirsiniz.</p>
  `;
  return {
    subject,
    html: wrapHtml(subject, body),
    text: `Sipariş iptali (${order.order_number}).`,
  };
}

const ORDER_MAIL_COLUMNS =
  "id, order_number, guest_email, guest_name, user_id, total, delivery_method, status, payment_status, shipping_address, pickup_code";

/** Sipariş id ile ilgili durum mailini gönderir. Hata sipariş akışını bozmaz. */
export async function sendOrderStatusEmail(
  supabase: SupabaseClient,
  orderId: string,
  kind: OrderEmailKind
): Promise<void> {
  try {
    const { data, error } = await supabase.from("orders").select(ORDER_MAIL_COLUMNS).eq("id", orderId).maybeSingle();
    if (error || !data) {
      console.warn("[order-email] sipariş bulunamadı:", orderId, error?.message);
      return;
    }
    const order = data as OrderMailRow;
    const to = await resolveCustomerEmail(supabase, order);
    if (!to) {
      console.warn("[order-email] alıcı e-posta yok:", order.order_number);
      return;
    }
    const content = buildContent(kind, order);
    await sendMail({ to, ...content });
  } catch (err) {
    console.error("[order-email] hata:", err);
  }
}

/** Admin durum değişimine göre mail türü. PROCESSING için ayrı mail yok (ödeme maili yeterli). */
export function emailKindForStatus(status: string, deliveryMethod?: string | null): OrderEmailKind | null {
  if (status === "SHIPPED") return "shipped";
  if (status === "DELIVERED") return "delivered";
  if (status === "CANCELLED") return "cancelled";
  if (status === "PROCESSING" && deliveryMethod === "store_pickup") {
    /* ödeme zaten paid maili attı; tekrar atma */
    return null;
  }
  return null;
}
