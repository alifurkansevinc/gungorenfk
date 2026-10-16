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

const BORDO = "#8B1538";
const BORDO_DARK = "#6B0F2A";
const INK = "#141414";
const MUTED = "#5c5c5c";
const LINE = "#e8e4e4";
const BG = "#f3f0f0";

const KIND_META: Record<
  OrderEmailKind,
  { badge: string; headline: (pickup: boolean) => string; accent: string }
> = {
  paid: {
    badge: "Ödeme alındı",
    headline: (pickup) => (pickup ? "Siparişiniz kayda geçti" : "Siparişiniz hazırlanıyor"),
    accent: BORDO,
  },
  shipped: {
    badge: "Yolda",
    headline: (pickup) => (pickup ? "Mağazadan teslime hazır" : "Siparişiniz kargoda"),
    accent: "#1e3a8a",
  },
  delivered: {
    badge: "Teslim edildi",
    headline: () => "Siparişiniz tamamlandı",
    accent: "#166534",
  },
  cancelled: {
    badge: "İptal",
    headline: () => "Sipariş iptal edildi",
    accent: "#991b1b",
  },
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

function deliveryLabel(order: OrderMailRow): string {
  return order.delivery_method === "store_pickup" ? "Mağazadan teslim" : "Kargo ile teslimat";
}

function supportLine(): string {
  return `<a href="mailto:bilgi@gungorenspor.com" style="color:${BORDO};text-decoration:none;font-weight:600;">bilgi@gungorenspor.com</a>`;
}

function renderItems(items: OrderItemRow[]): string {
  if (!items.length) return "";
  const rows = items
    .map((it) => {
      const name = escapeHtml(it.name || "Ürün");
      const size = it.size ? ` · ${escapeHtml(String(it.size))}` : "";
      const qty = Number(it.quantity) || 1;
      const line = formatTry((Number(it.price) || 0) * qty);
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};">
          <strong style="font-weight:600;">${name}</strong>${size}
          <div style="color:${MUTED};font-size:12px;margin-top:2px;">Adet: ${qty}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};text-align:right;white-space:nowrap;vertical-align:top;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
      <tr><td colspan="2" style="padding:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};font-weight:700;">Sipariş özeti</td></tr>
      ${rows}
    </table>`;
}

function renderTotals(order: OrderMailRow): string {
  const shipping = Number(order.shipping_cost) || 0;
  const total = Number(order.total) || 0;
  const shippingRow =
    order.delivery_method === "shipping"
      ? `<tr>
          <td style="padding:4px 0;font-size:13px;color:${MUTED};">Kargo</td>
          <td style="padding:4px 0;font-size:13px;color:${MUTED};text-align:right;">${escapeHtml(formatTry(shipping))}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${shippingRow}
      <tr>
        <td style="padding:10px 0 0;font-size:15px;color:${INK};font-weight:700;border-top:2px solid ${INK};">Toplam</td>
        <td style="padding:10px 0 0;font-size:15px;color:${INK};font-weight:700;text-align:right;border-top:2px solid ${INK};">${escapeHtml(formatTry(total))}</td>
      </tr>
    </table>`;
}

function metaCard(order: OrderMailRow, isPickup: boolean): string {
  const pickup =
    isPickup && order.pickup_code
      ? `<tr>
          <td style="padding:8px 0;font-size:13px;color:${MUTED};width:40%;">Teslim kodu</td>
          <td style="padding:8px 0;font-size:15px;color:${INK};font-weight:700;letter-spacing:0.06em;">${escapeHtml(order.pickup_code)}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f8;border:1px solid ${LINE};border-radius:10px;margin:20px 0;">
      <tr><td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${MUTED};width:40%;border-bottom:1px solid ${LINE};">Sipariş no</td>
            <td style="padding:8px 0;font-size:14px;color:${INK};font-weight:700;border-bottom:1px solid ${LINE};">${escapeHtml(order.order_number)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:${MUTED};border-bottom:1px solid ${LINE};">Teslimat</td>
            <td style="padding:8px 0;font-size:14px;color:${INK};border-bottom:1px solid ${LINE};">${escapeHtml(deliveryLabel(order))}</td>
          </tr>
          ${pickup}
        </table>
      </td></tr>
    </table>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
      <tr>
        <td style="border-radius:6px;background:${BORDO};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 22px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function wrapEmail(opts: {
  title: string;
  badge: string;
  accent: string;
  headline: string;
  intro: string;
  bodyExtra: string;
  order: OrderMailRow;
  items: OrderItemRow[];
  site: string;
}): string {
  const logo = `${opts.site}/icon-192.png`;
  const isPickup = opts.order.delivery_method === "store_pickup";
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:Georgia,'Times New Roman',serif;color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.headline)} · ${escapeHtml(opts.order.order_number)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:580px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${LINE};">
        <tr>
          <td style="background:linear-gradient(135deg,${BORDO_DARK} 0%,${BORDO} 100%);padding:22px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${escapeHtml(logo)}" width="44" height="44" alt="Güngören Spor" style="display:block;border-radius:50%;border:2px solid rgba(255,255,255,0.35);">
                </td>
                <td style="vertical-align:middle;padding-left:14px;">
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Güngören Spor</div>
                  <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;color:#ffffff;margin-top:2px;">Mağaza</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="height:4px;background:${opts.accent};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px;font-family:Arial,Helvetica,sans-serif;">
            <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${opts.accent}14;color:${opts.accent};font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(opts.badge)}</span>
            <h1 style="margin:16px 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:${INK};">${escapeHtml(opts.headline)}</h1>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${MUTED};">${opts.intro}</p>
            ${metaCard(opts.order, isPickup)}
            ${opts.bodyExtra}
            ${renderItems(opts.items)}
            ${renderTotals(opts.order)}
            ${ctaButton(opts.site, "Siteye git")}
            <p style="margin:18px 0 0;font-size:13px;line-height:1.55;color:${MUTED};">Sorularınız için ${supportLine()}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#8a8a8a;border-top:1px solid ${LINE};">
            Bu e-posta sipariş bilgilendirmesi için otomatik gönderilmiştir.<br>
            © Güngören Spor · <a href="${escapeHtml(opts.site)}" style="color:${BORDO};text-decoration:none;">gungorenspor.com</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildCopy(kind: OrderEmailKind, order: OrderMailRow, name: string): { subject: string; intro: string; bodyExtra: string; text: string } {
  const isPickup = order.delivery_method === "store_pickup";
  const refunded = order.payment_status === "REFUNDED";
  const no = order.order_number;
  const total = formatTry(Number(order.total) || 0);

  if (kind === "paid") {
    const subject = `Siparişiniz alındı — ${no}`;
    const intro = `Merhaba <strong style="color:${INK};">${name}</strong>, ödemeniz alındı. Teşekkür ederiz.`;
    const bodyExtra = isPickup
      ? `<p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Siparişiniz hazırlandığında mağazadan teslim alabilirsiniz. Teslim kodunuz yukarıda yer alır.</p>`
      : `<p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Siparişiniz hazırlanıyor. Kargoya verildiğinde sizi bilgilendireceğiz.</p>`;
    return {
      subject,
      intro,
      bodyExtra,
      text: `Siparişiniz alındı (${no}). Tutar: ${total}.`,
    };
  }

  if (kind === "shipped") {
    const subject = isPickup ? `Teslime hazır — ${no}` : `Siparişiniz kargoda — ${no}`;
    const intro = isPickup
      ? `Merhaba <strong style="color:${INK};">${name}</strong>, siparişiniz mağazadan teslime hazır.`
      : `Merhaba <strong style="color:${INK};">${name}</strong>, siparişiniz kargoya verildi.`;
    const bodyExtra = isPickup
      ? `<p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Teslim alırken kimliğiniz ve teslim kodunuz yeterli olacaktır.</p>`
      : `<p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Kargo sürecinde gecikme olursa bize yazmaktan çekinmeyin.</p>`;
    return { subject, intro, bodyExtra, text: `${subject}. Tutar: ${total}.` };
  }

  if (kind === "delivered") {
    const subject = `Siparişiniz teslim edildi — ${no}`;
    const intro = `Merhaba <strong style="color:${INK};">${name}</strong>, siparişiniz teslim edildi.`;
    const bodyExtra = `<p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Bizi tercih ettiğiniz için teşekkür ederiz. Görüşleriniz bizim için değerli.</p>`;
    return { subject, intro, bodyExtra, text: `Siparişiniz teslim edildi (${no}).` };
  }

  const subject = refunded ? `Sipariş iadesi — ${no}` : `Sipariş iptali — ${no}`;
  const intro = refunded
    ? `Merhaba <strong style="color:${INK};">${name}</strong>, siparişiniz iptal edildi ve iade süreci başlatıldı.`
    : `Merhaba <strong style="color:${INK};">${name}</strong>, siparişiniz iptal edildi.`;
  const bodyExtra = `<p style="margin:0;font-size:14px;line-height:1.6;color:${MUTED};">Yardıma ihtiyacınız olursa ${supportLine()} adresinden bize ulaşabilirsiniz.</p>`;
  return { subject, intro, bodyExtra, text: `${subject}. Tutar: ${total}.` };
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
  const html = wrapEmail({
    title: copy.subject,
    badge: meta.badge,
    accent: meta.accent,
    headline: meta.headline(isPickup),
    intro: copy.intro,
    bodyExtra: copy.bodyExtra,
    order,
    items,
    site,
  });
  return { subject: copy.subject, html, text: copy.text };
}

const ORDER_MAIL_COLUMNS =
  "id, order_number, guest_email, guest_name, user_id, total, subtotal, shipping_cost, delivery_method, status, payment_status, shipping_address, pickup_code";

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

/** Admin durum değişimine göre mail türü. PROCESSING için ayrı mail yok (ödeme maili yeterli). */
export function emailKindForStatus(status: string, _deliveryMethod?: string | null): OrderEmailKind | null {
  if (status === "SHIPPED") return "shipped";
  if (status === "DELIVERED") return "delivered";
  if (status === "CANCELLED") return "cancelled";
  return null;
}
