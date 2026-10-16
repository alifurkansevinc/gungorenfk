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
const BORDO_DARK = "#5c0c24";
const BLACK = "#0a0a0a";
const INK = "#111111";
const MUTED = "#6b6b6b";
const LINE = "#ece8e8";
const BG = "#e9e4e4";

const LOGO_URL =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png";
const SLOGAN_URL =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-06.png";

const FONT_BODY = "'DM Sans',Arial,Helvetica,sans-serif";
const FONT_DISPLAY = "'Archivo Black','Arial Black',Arial,sans-serif";

const KIND_META: Record<
  OrderEmailKind,
  { badge: string; headline: (pickup: boolean) => string; step: string; accent: string }
> = {
  paid: {
    badge: "01 · Ödeme",
    headline: (pickup) => (pickup ? "Kayıt tamam" : "Hazırlığa geçtik"),
    step: "ÖDEME ALINDI",
    accent: BORDO,
  },
  shipped: {
    badge: "02 · Sevkiyat",
    headline: (pickup) => (pickup ? "Gel al" : "Yola çıktı"),
    step: "SEVKİYAT",
    accent: "#c41e3a",
  },
  delivered: {
    badge: "03 · Teslim",
    headline: () => "Sahadasın",
    step: "TESLİM",
    accent: "#0f7a45",
  },
  cancelled: {
    badge: "İptal",
    headline: () => "Sipariş kapandı",
    step: "İPTAL",
    accent: "#7f1d1d",
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
  return order.delivery_method === "store_pickup" ? "Mağazadan teslim" : "Kargo";
}

function supportLine(): string {
  return `<a href="mailto:bilgi@gungorenspor.com" style="color:${BORDO};text-decoration:none;font-weight:700;">bilgi@gungorenspor.com</a>`;
}

function renderItems(items: OrderItemRow[]): string {
  if (!items.length) return "";
  const rows = items
    .map((it, idx) => {
      const name = escapeHtml(it.name || "Ürün");
      const size = it.size ? escapeHtml(String(it.size)) : "—";
      const qty = Number(it.quantity) || 1;
      const line = formatTry((Number(it.price) || 0) * qty);
      const bg = idx % 2 === 0 ? "#f7f5f5" : "#ffffff";
      return `<tr style="background:${bg};">
        <td style="padding:12px 14px;font-family:${FONT_BODY};font-size:14px;color:${INK};border-left:3px solid ${BORDO};">
          <div style="font-weight:700;">${name}</div>
          <div style="margin-top:3px;font-size:12px;color:${MUTED};">${size} · ×${qty}</div>
        </td>
        <td style="padding:12px 14px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${INK};text-align:right;white-space:nowrap;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;border-collapse:separate;border-spacing:0 6px;">
      <tr>
        <td colspan="2" style="padding:0 0 4px;font-family:${FONT_DISPLAY};font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Kadrodakiler</td>
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
          <td style="padding:4px 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED};">Kargo</td>
          <td style="padding:4px 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED};text-align:right;">${escapeHtml(formatTry(shipping))}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
      ${shippingRow}
      <tr>
        <td style="padding:14px 0 0;font-family:${FONT_DISPLAY};font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:${BLACK};border-top:3px solid ${BLACK};">Toplam</td>
        <td style="padding:14px 0 0;font-family:${FONT_DISPLAY};font-size:22px;color:${BORDO};text-align:right;border-top:3px solid ${BLACK};">${escapeHtml(formatTry(total))}</td>
      </tr>
    </table>`;
}

/** Bilet / stub tarzı sipariş metası */
function ticketStub(order: OrderMailRow, isPickup: boolean, step: string, accent: string): string {
  const pickup = isPickup && order.pickup_code
    ? `<div style="margin-top:14px;padding-top:12px;border-top:1px dashed rgba(255,255,255,0.25);">
        <div style="font-family:${FONT_BODY};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Teslim kodu</div>
        <div style="font-family:${FONT_DISPLAY};font-size:28px;letter-spacing:0.2em;color:#ffffff;margin-top:4px;">${escapeHtml(order.pickup_code)}</div>
      </div>`
    : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;background:${BLACK};border-radius:4px;overflow:hidden;">
      <tr>
        <td width="8" style="width:8px;background:${accent};font-size:0;">&nbsp;</td>
        <td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-family:${FONT_BODY};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Sipariş bileti</div>
                <div style="font-family:${FONT_DISPLAY};font-size:20px;color:#ffffff;margin-top:6px;letter-spacing:0.04em;">${escapeHtml(order.order_number)}</div>
                <div style="font-family:${FONT_BODY};font-size:13px;color:rgba(255,255,255,0.72);margin-top:8px;">${escapeHtml(deliveryLabel(order))}</div>
                ${pickup}
              </td>
              <td width="96" align="right" valign="top" style="width:96px;">
                <div style="display:inline-block;padding:8px 10px;border:1px solid rgba(255,255,255,0.35);border-radius:2px;font-family:${FONT_DISPLAY};font-size:10px;letter-spacing:0.1em;color:#ffffff;text-align:center;line-height:1.35;">
                  ${escapeHtml(step)}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 10px;">
      <tr>
        <td style="background:${BLACK};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:16px 28px;font-family:${FONT_DISPLAY};font-size:13px;color:#ffffff;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;border-bottom:4px solid ${BORDO};">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function wrapEmail(opts: {
  title: string;
  badge: string;
  accent: string;
  headline: string;
  step: string;
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
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${BG};font-family:${FONT_BODY};color:${INK};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.headline)} · ${escapeHtml(opts.order.order_number)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 12px 32px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;overflow:visible;">
        <!-- Siyah sahne + diagonal bordo accent hissi -->
        <tr>
          <td style="padding:0;background:${BLACK};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td colspan="2" style="height:6px;background:${BORDO};font-size:0;line-height:0;">&nbsp;</td>
              </tr>
              <tr>
                <td width="130" valign="top" style="width:130px;padding:0 0 0 24px;">
                  <img src="${LOGO_URL}" width="108" height="108" alt="Güngören Spor" style="display:block;width:108px;height:108px;margin-top:-22px;margin-bottom:-42px;border-radius:50%;border:6px solid #ffffff;background:#ffffff;box-shadow:0 14px 30px rgba(0,0,0,0.45);">
                </td>
                <td valign="middle" style="padding:26px 24px 18px 8px;">
                  <div style="font-family:${FONT_BODY};font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${BORDO};">Güngören Belediye Spor</div>
                  <div style="font-family:${FONT_DISPLAY};font-size:26px;line-height:1;color:#ffffff;margin-top:8px;letter-spacing:0.02em;">GÜNGÖREN FK</div>
                  <div style="font-family:${FONT_BODY};font-size:12px;color:rgba(255,255,255,0.55);margin-top:8px;letter-spacing:0.08em;text-transform:uppercase;">Resmi mağaza</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:8px 24px 0 142px;">
                  <img src="${SLOGAN_URL}" width="220" height="72" alt="Hiç vazgeçmedik" style="display:block;width:220px;max-width:100%;height:auto;opacity:0.95;">
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:10px 24px 18px 142px;font-family:${FONT_DISPLAY};font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                  Hiç vazgeçmedik
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Durum şeridi -->
        <tr>
          <td style="background:${opts.accent};padding:12px 24px 12px 142px;">
            <span style="font-family:${FONT_DISPLAY};font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;">${escapeHtml(opts.badge)}</span>
          </td>
        </tr>

        <!-- İçerik -->
        <tr>
          <td style="padding:48px 28px 12px;font-family:${FONT_BODY};">
            <h1 style="margin:0 0 14px;font-family:${FONT_DISPLAY};font-size:34px;line-height:0.95;letter-spacing:-0.01em;text-transform:uppercase;color:${BLACK};">${escapeHtml(opts.headline)}</h1>
            <p style="margin:0 0 4px;font-size:15px;line-height:1.65;color:${MUTED};">${opts.intro}</p>
            ${ticketStub(opts.order, isPickup, opts.step, opts.accent)}
            ${opts.bodyExtra}
            ${renderItems(opts.items)}
            ${renderTotals(opts.order)}
            ${ctaButton(opts.site, "Mağazaya dön")}
            <p style="margin:16px 0 0;font-size:13px;line-height:1.55;color:${MUTED};">Destek: ${supportLine()}</p>
          </td>
        </tr>

        <!-- Footer slogan band -->
        <tr>
          <td style="background:${BLACK};padding:22px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle">
                  <div style="font-family:${FONT_DISPLAY};font-size:14px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;">Hiç vazgeçmedik</div>
                  <div style="font-family:${FONT_BODY};font-size:11px;color:rgba(255,255,255,0.45);margin-top:8px;line-height:1.5;">
                    Otomatik sipariş bildirimi · <a href="${escapeHtml(opts.site)}" style="color:${BORDO};text-decoration:none;">gungorenspor.com</a>
                  </div>
                </td>
                <td width="72" align="right" valign="middle">
                  <img src="${LOGO_URL}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:50%;opacity:0.9;">
                </td>
              </tr>
            </table>
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
    const intro = `Merhaba <strong style="color:${INK};">${name}</strong> — ödemen geçti, top artık bizde.`;
    const bodyExtra = isPickup
      ? `<p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">Hazır olunca mağazadan teslim. Kodun biletin üzerinde.</p>`
      : `<p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">Paket hazırlanıyor. Kargoya çıkınca haber uçacak.</p>`;
    return { subject, intro, bodyExtra, text: `Siparişiniz alındı (${no}). Tutar: ${total}.` };
  }

  if (kind === "shipped") {
    const subject = isPickup ? `Teslime hazır — ${no}` : `Siparişiniz kargoda — ${no}`;
    const intro = isPickup
      ? `Merhaba <strong style="color:${INK};">${name}</strong> — siparişin mağazada seni bekliyor.`
      : `Merhaba <strong style="color:${INK};">${name}</strong> — paket yola çıktı.`;
    const bodyExtra = isPickup
      ? `<p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">Kimlik + teslim kodu yeterli.</p>`
      : `<p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">Takipte takılırsan yaz: bilgi@gungorenspor.com</p>`;
    return { subject, intro, bodyExtra, text: `${subject}. Tutar: ${total}.` };
  }

  if (kind === "delivered") {
    const subject = `Siparişiniz teslim edildi — ${no}`;
    const intro = `Merhaba <strong style="color:${INK};">${name}</strong> — teslim tamam. Forma gibi yakışsın.`;
    const bodyExtra = `<p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">Bizi tercih ettiğin için teşekkürler. Görüşlerin değerli.</p>`;
    return { subject, intro, bodyExtra, text: `Siparişiniz teslim edildi (${no}).` };
  }

  const subject = refunded ? `Sipariş iadesi — ${no}` : `Sipariş iptali — ${no}`;
  const intro = refunded
    ? `Merhaba <strong style="color:${INK};">${name}</strong> — sipariş kapandı, iade süreci başladı.`
    : `Merhaba <strong style="color:${INK};">${name}</strong> — sipariş iptal edildi.`;
  const bodyExtra = `<p style="margin:0;font-size:14px;line-height:1.65;color:${MUTED};">Yardıma ihtiyacın olursa ${supportLine()}</p>`;
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
    step: meta.step,
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
