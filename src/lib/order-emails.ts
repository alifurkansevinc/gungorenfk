import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-url";
import {
  BRAND,
  escapeHtml,
  formatTry,
  metaPanel,
  wrapBrandEmail,
} from "@/lib/brand-email";

export type OrderEmailKind = "paid" | "shipped" | "delivered" | "cancelled";

type OrderMailRow = {
  id: string;
  order_number: string;
  guest_email: string | null;
  guest_name: string | null;
  user_id: string | null;
  total: number | null;
  subtotal: number | null;
  shipping_cost: number | null;
  delivery_method: string | null;
  status: string;
  payment_status: string;
  shipping_address: Record<string, unknown> | null;
  pickup_code: string | null;
};

type OrderItemRow = {
  name: string | null;
  quantity: number | null;
  price: number | null;
  size: string | null;
};

const { siyah: SIYAH, muted: MUTED, line: LINE, fontBody, fontDisplay } = BRAND;

const KIND_META: Record<
  OrderEmailKind,
  {
    eyebrow: string;
    line1: (pickup: boolean) => string;
    line2: (pickup: boolean) => string;
    note: (pickup: boolean) => string;
  }
> = {
  paid: {
    eyebrow: "Ödeme onaylandı",
    line1: () => "Siparişiniz",
    line2: (pickup) => (pickup ? "kayda geçti" : "hazırlanıyor"),
    note: (pickup) =>
      pickup
        ? "Hazır olduğunda mağazadan teslim alabilirsiniz."
        : "Paket hazırlanıyor. Kargoya çıkınca haber vereceğiz.",
  },
  shipped: {
    eyebrow: "Sevkiyat",
    line1: () => "Siparişiniz",
    line2: (pickup) => (pickup ? "teslime hazır" : "yola çıktı"),
    note: (pickup) =>
      pickup
        ? "Kimlik ve teslim kodu ile mağazadan alabilirsiniz."
        : "Kargo sürecinde sorun olursa bize yazın.",
  },
  delivered: {
    eyebrow: "Teslimat tamam",
    line1: () => "Siparişiniz",
    line2: () => "teslim edildi",
    note: () => "Bizi tercih ettiğiniz için teşekkür ederiz.",
  },
  cancelled: {
    eyebrow: "Sipariş kapandı",
    line1: () => "Sipariş",
    line2: () => "iptal edildi",
    note: () => "Sorularınız için bilgi@gungorenspor.com",
  },
};

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

function deliveryLabel(order: OrderMailRow): string {
  return order.delivery_method === "store_pickup" ? "Mağazadan teslim" : "Kargo";
}

function supportLink(): string {
  return `<a href="mailto:bilgi@gungorenspor.com" style="color:${BRAND.bordo};text-decoration:none;font-weight:800;">bilgi@gungorenspor.com</a>`;
}

function renderItems(items: OrderItemRow[]): string {
  if (!items.length) return "";
  const rows = items
    .map((it) => {
      const name = escapeHtml(it.name || "Ürün");
      const size = it.size ? escapeHtml(String(it.size)) : "—";
      const qty = Number(it.quantity) || 1;
      const line = formatTry((Number(it.price) || 0) * qty);
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};">
          <div style="font-family:${fontBody};font-size:15px;font-weight:800;color:${SIYAH};">${name}</div>
          <div style="margin-top:4px;font-family:${fontBody};font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">${size} · ×${qty}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font-family:${fontBody};font-size:15px;font-weight:800;color:${SIYAH};text-align:right;white-space:nowrap;vertical-align:top;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
      <tr>
        <td colspan="2" style="padding:0 0 8px;font-family:${fontBody};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Sipariş özeti</td>
      </tr>
      ${rows}
    </table>`;
}

function renderTotals(order: OrderMailRow): string {
  const shipping = Number(order.shipping_cost) || 0;
  const total = Number(order.total) || 0;
  const shippingRow =
    order.delivery_method === "shipping"
      ? `<tr>
          <td style="padding:8px 0;font-family:${fontBody};font-size:14px;font-weight:600;color:${MUTED};">Kargo</td>
          <td style="padding:8px 0;font-family:${fontBody};font-size:14px;font-weight:700;color:${MUTED};text-align:right;">${escapeHtml(formatTry(shipping))}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
      ${shippingRow}
      <tr>
        <td style="padding:16px 0 0;font-family:${fontDisplay};font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${SIYAH};border-top:2px solid ${SIYAH};">Toplam</td>
        <td style="padding:16px 0 0;font-family:${fontBody};font-size:22px;font-weight:800;color:${BRAND.bordo};text-align:right;border-top:2px solid ${SIYAH};">${escapeHtml(formatTry(total))}</td>
      </tr>
    </table>`;
}

function buildCopy(
  kind: OrderEmailKind,
  order: OrderMailRow,
  name: string
): { subject: string; intro: string; text: string } {
  const isPickup = order.delivery_method === "store_pickup";
  const refunded = order.payment_status === "REFUNDED";
  const no = order.order_number;
  const total = formatTry(Number(order.total) || 0);
  const meta = KIND_META[kind];

  if (kind === "paid") {
    return {
      subject: `Siparişiniz alındı — ${no}`,
      intro: `Merhaba <strong style="color:${SIYAH};font-weight:800;">${name}</strong>, ödemeniz alındı.`,
      text: `Siparişiniz alındı (${no}). Tutar: ${total}. ${meta.note(isPickup)}`,
    };
  }
  if (kind === "shipped") {
    return {
      subject: isPickup ? `Teslime hazır — ${no}` : `Siparişiniz kargoda — ${no}`,
      intro: `Merhaba <strong style="color:${SIYAH};font-weight:800;">${name}</strong>, siparişiniz hareketlendi.`,
      text: `${isPickup ? "Teslime hazır" : "Kargoda"} (${no}). ${meta.note(isPickup)}`,
    };
  }
  if (kind === "delivered") {
    return {
      subject: `Siparişiniz teslim edildi — ${no}`,
      intro: `Merhaba <strong style="color:${SIYAH};font-weight:800;">${name}</strong>, teslimat tamamlandı.`,
      text: `Teslim edildi (${no}).`,
    };
  }
  return {
    subject: refunded ? `Sipariş iadesi — ${no}` : `Sipariş iptali — ${no}`,
    intro: `Merhaba <strong style="color:${SIYAH};font-weight:800;">${name}</strong>, ${
      refunded ? "iade süreci başlatıldı." : "siparişiniz iptal edildi."
    }`,
    text: `İptal (${no}).`,
  };
}

export function buildOrderEmailContent(
  kind: OrderEmailKind,
  order: OrderMailRow,
  items: OrderItemRow[] = []
): { subject: string; html: string; text: string } {
  const site = getSiteUrl();
  const name = escapeHtml(customerName(order));
  const meta = KIND_META[kind];
  const isPickup = order.delivery_method === "store_pickup";
  const copy = buildCopy(kind, order, name);

  const panelRows: Array<{ label: string; value: string; large?: boolean }> = [
    { label: "Sipariş no", value: order.order_number, large: true },
    { label: "Teslimat", value: deliveryLabel(order) },
  ];
  if (isPickup && order.pickup_code) {
    panelRows.push({ label: "Teslim kodu", value: order.pickup_code, large: true });
  }

  const bodyHtml = `
    ${metaPanel(panelRows)}
    <p style="margin:0 0 16px;font-family:${fontBody};font-size:14px;font-weight:600;line-height:1.6;color:${MUTED};">${escapeHtml(meta.note(isPickup))}</p>
    ${renderItems(items)}
    ${renderTotals(order)}
    <p style="margin:18px 0 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${MUTED};">Destek: ${supportLink()}</p>
  `;

  const html = wrapBrandEmail({
    title: copy.subject,
    eyebrow: meta.eyebrow,
    line1: meta.line1(isPickup),
    line2: meta.line2(isPickup),
    introHtml: copy.intro,
    bodyHtml,
    ctaHref: `${site}/magaza`,
    ctaLabel: "Mağazaya dön",
    preheader: `${meta.line1(isPickup)} ${meta.line2(isPickup)} · ${order.order_number}`,
  });
  return { subject: copy.subject, html, text: copy.text };
}

const ORDER_MAIL_COLUMNS =
  "id, order_number, guest_email, guest_name, user_id, total, subtotal, shipping_cost, delivery_method, status, payment_status, shipping_address, pickup_code";

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

    const { data: itemsRaw } = await supabase
      .from("order_items")
      .select("name, quantity, price, size")
      .eq("order_id", orderId);
    const items = (itemsRaw || []) as OrderItemRow[];

    const content = buildOrderEmailContent(kind, order, items);
    await sendMail({ to, ...content });
  } catch (err) {
    console.error("[order-email] hata:", err);
  }
}

export function emailKindForStatus(status: string, _deliveryMethod?: string | null): OrderEmailKind | null {
  if (status === "SHIPPED") return "shipped";
  if (status === "DELIVERED") return "delivered";
  if (status === "CANCELLED") return "cancelled";
  return null;
}
