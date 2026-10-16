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

/** Site ile aynı palet / varlıklar */
const BORDO = "#8B1538";
const SIYAH = "#0A0A0A";
const BEYAZ = "#FFFFFF";
const MUTED = "#5a5a5a";
const LINE = "rgba(10,10,10,0.1)";
const PAGE_BG = "#f8f8f8";

const SITE_LOGO =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png";
const SLOGAN_IMG =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-06.png";

const FONT_BODY = "'Outfit',system-ui,-apple-system,sans-serif";
const FONT_DISPLAY = "'Oswald',Arial,Helvetica,sans-serif";

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
    badge: "Sevkiyat",
    headline: (pickup) => (pickup ? "Mağazadan teslime hazır" : "Siparişiniz kargoda"),
    accent: BORDO,
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
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font-family:${FONT_BODY};font-size:15px;color:${SIYAH};">
          <strong style="font-weight:600;">${name}</strong>${size}
          <div style="color:${MUTED};font-size:13px;margin-top:4px;font-weight:400;">Adet: ${qty}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${LINE};font-family:${FONT_BODY};font-size:15px;font-weight:600;color:${SIYAH};text-align:right;white-space:nowrap;vertical-align:top;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;">
      <tr>
        <td colspan="2" style="padding:0 0 10px;font-family:${FONT_DISPLAY};font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Sipariş özeti</td>
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
          <td style="padding:6px 0;font-family:${FONT_BODY};font-size:14px;color:${MUTED};">Kargo</td>
          <td style="padding:6px 0;font-family:${FONT_BODY};font-size:14px;color:${MUTED};text-align:right;">${escapeHtml(formatTry(shipping))}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      ${shippingRow}
      <tr>
        <td style="padding:14px 0 0;font-family:${FONT_DISPLAY};font-size:14px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${SIYAH};border-top:1px solid ${SIYAH};">Toplam</td>
        <td style="padding:14px 0 0;font-family:${FONT_BODY};font-size:20px;font-weight:700;color:${BORDO};text-align:right;border-top:1px solid ${SIYAH};">${escapeHtml(formatTry(total))}</td>
      </tr>
    </table>`;
}

function metaBlock(order: OrderMailRow, isPickup: boolean): string {
  const pickup =
    isPickup && order.pickup_code
      ? `<tr>
          <td style="padding:12px 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED};width:38%;border-top:1px solid ${LINE};">Teslim kodu</td>
          <td style="padding:12px 0;font-family:${FONT_DISPLAY};font-size:18px;font-weight:600;letter-spacing:0.12em;color:${SIYAH};border-top:1px solid ${LINE};">${escapeHtml(order.pickup_code)}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
      <tr>
        <td style="padding:12px 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED};width:38%;">Sipariş no</td>
        <td style="padding:12px 0;font-family:${FONT_BODY};font-size:15px;font-weight:600;color:${SIYAH};">${escapeHtml(order.order_number)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED};border-top:1px solid ${LINE};">Teslimat</td>
        <td style="padding:12px 0;font-family:${FONT_BODY};font-size:15px;color:${SIYAH};border-top:1px solid ${LINE};">${escapeHtml(deliveryLabel(order))}</td>
      </tr>
      ${pickup}
    </table>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 12px;">
      <tr>
        <td style="border-radius:999px;background:${BORDO};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${BEYAZ};text-decoration:none;letter-spacing:0.02em;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/**
 * gungorenspor.com header diline yakın:
 * siyah bar + yatay logo (daire/overlap yok) + Oswald/Outfit + slogan vurgusu
 */
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
  const isPickup = opts.order.delivery_method === "store_pickup";
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:${FONT_BODY};color:${SIYAH};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.headline)} · ${escapeHtml(opts.order.order_number)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:0;">
    <tr><td align="center" style="padding:0;">

      <!-- Site header gibi üst bar -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SIYAH};">
        <tr>
          <td align="center" style="padding:0;">
            <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 24px 8px;border-bottom:1px solid rgba(255,255,255,0.1);">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-family:${FONT_BODY};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);">
                        Resmi internet sitesi
                      </td>
                      <td align="right" style="font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${BORDO};">
                        Mağaza
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 24px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td valign="middle" style="vertical-align:middle;">
                        <a href="${escapeHtml(opts.site)}" style="text-decoration:none;">
                          <img src="${SITE_LOGO}" width="140" height="56" alt="Güngören FK" style="display:block;height:52px;width:auto;max-width:160px;object-fit:contain;border:0;">
                        </a>
                      </td>
                      <td valign="middle" align="right" style="vertical-align:middle;">
                        <div style="font-family:${FONT_DISPLAY};font-size:18px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BEYAZ};">Güngören FK</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- İçerik kartı -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr>
          <td style="padding:28px 24px 8px;background:${BEYAZ};">
            <span style="display:inline-block;font-family:${FONT_BODY};font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${opts.accent};">${escapeHtml(opts.badge)}</span>
            <h1 style="margin:12px 0 14px;font-family:${FONT_DISPLAY};font-size:36px;line-height:1.05;font-weight:700;letter-spacing:-0.01em;color:${SIYAH};">${escapeHtml(opts.headline)}</h1>
            <p style="margin:0;font-family:${FONT_BODY};font-size:16px;font-weight:300;line-height:1.6;color:${MUTED};">${opts.intro}</p>
            ${metaBlock(opts.order, isPickup)}
            ${opts.bodyExtra}
            ${renderItems(opts.items)}
            ${renderTotals(opts.order)}
            ${ctaButton(opts.site, "Siteye git")}
            <p style="margin:8px 0 0;font-family:${FONT_BODY};font-size:13px;line-height:1.55;color:${MUTED};">Sorularınız için ${supportLine()}</p>
          </td>
        </tr>

        <!-- Slogan bandı — ana sayfa sağ görsel dili -->
        <tr>
          <td style="background:${SIYAH};padding:28px 24px;text-align:center;">
            <img src="${SLOGAN_IMG}" width="280" height="90" alt="Hiç vazgeçmedik" style="display:inline-block;width:280px;max-width:85%;height:auto;margin:0 auto 14px;">
            <div style="font-family:${FONT_DISPLAY};font-size:14px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${BEYAZ};">Hiç vazgeçmedik</div>
            <div style="margin-top:14px;font-family:${FONT_BODY};font-size:11px;color:rgba(255,255,255,0.45);line-height:1.5;">
              Otomatik sipariş bilgilendirmesi<br>
              <a href="${escapeHtml(opts.site)}" style="color:${BORDO};text-decoration:none;font-weight:600;">gungorenspor.com</a>
            </div>
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
    const intro = `Merhaba <strong style="color:${SIYAH};font-weight:600;">${name}</strong>, ödemeniz alındı. Teşekkür ederiz.`;
    const bodyExtra = isPickup
      ? `<p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${MUTED};">Siparişiniz hazırlandığında mağazadan teslim alabilirsiniz. Teslim kodunuz yukarıda yer alır.</p>`
      : `<p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${MUTED};">Siparişiniz hazırlanıyor. Kargoya verildiğinde sizi bilgilendireceğiz.</p>`;
    return { subject, intro, bodyExtra, text: `Siparişiniz alındı (${no}). Tutar: ${total}.` };
  }

  if (kind === "shipped") {
    const subject = isPickup ? `Teslime hazır — ${no}` : `Siparişiniz kargoda — ${no}`;
    const intro = isPickup
      ? `Merhaba <strong style="color:${SIYAH};font-weight:600;">${name}</strong>, siparişiniz mağazadan teslime hazır.`
      : `Merhaba <strong style="color:${SIYAH};font-weight:600;">${name}</strong>, siparişiniz kargoya verildi.`;
    const bodyExtra = isPickup
      ? `<p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${MUTED};">Teslim alırken kimliğiniz ve teslim kodunuz yeterli olacaktır.</p>`
      : `<p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${MUTED};">Kargo sürecinde sorun olursa bilgi@gungorenspor.com adresine yazabilirsiniz.</p>`;
    return { subject, intro, bodyExtra, text: `${subject}. Tutar: ${total}.` };
  }

  if (kind === "delivered") {
    const subject = `Siparişiniz teslim edildi — ${no}`;
    const intro = `Merhaba <strong style="color:${SIYAH};font-weight:600;">${name}</strong>, siparişiniz teslim edildi.`;
    const bodyExtra = `<p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${MUTED};">Bizi tercih ettiğiniz için teşekkür ederiz.</p>`;
    return { subject, intro, bodyExtra, text: `Siparişiniz teslim edildi (${no}).` };
  }

  const subject = refunded ? `Sipariş iadesi — ${no}` : `Sipariş iptali — ${no}`;
  const intro = refunded
    ? `Merhaba <strong style="color:${SIYAH};font-weight:600;">${name}</strong>, siparişiniz iptal edildi ve iade süreci başlatıldı.`
    : `Merhaba <strong style="color:${SIYAH};font-weight:600;">${name}</strong>, siparişiniz iptal edildi.`;
  const bodyExtra = `<p style="margin:0;font-family:${FONT_BODY};font-size:15px;line-height:1.6;color:${MUTED};">Yardıma ihtiyacınız olursa ${supportLine()}</p>`;
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
