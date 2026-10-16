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

/** gungorenspor.com paleti */
const BORDO = "#8B1538";
const SIYAH = "#0A0A0A";
const BEYAZ = "#FFFFFF";
const MUTED = "rgba(255,255,255,0.55)";
const LINE = "rgba(255,255,255,0.12)";

const SITE_LOGO =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png";

const FONT_BODY = "'Outfit',system-ui,-apple-system,BlinkMacSystemFont,sans-serif";
const FONT_DISPLAY = "'Oswald',Arial,Helvetica,sans-serif";

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

function supportLink(): string {
  return `<a href="mailto:bilgi@gungorenspor.com" style="color:${BORDO};text-decoration:none;font-weight:600;">bilgi@gungorenspor.com</a>`;
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
        <td style="padding:16px 0;border-bottom:1px solid ${LINE};">
          <div style="font-family:${FONT_BODY};font-size:15px;font-weight:600;color:${BEYAZ};">${name}</div>
          <div style="margin-top:4px;font-family:${FONT_BODY};font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${MUTED};">${size} · ×${qty}</div>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid ${LINE};font-family:${FONT_BODY};font-size:15px;font-weight:600;color:${BEYAZ};text-align:right;white-space:nowrap;vertical-align:top;">${escapeHtml(line)}</td>
      </tr>`;
    })
    .join("");
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr>
        <td colspan="2" style="padding:0 0 8px;font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">Sipariş özeti</td>
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
          <td style="padding:8px 0;font-family:${FONT_BODY};font-size:14px;color:${MUTED};">Kargo</td>
          <td style="padding:8px 0;font-family:${FONT_BODY};font-size:14px;color:${MUTED};text-align:right;">${escapeHtml(formatTry(shipping))}</td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;">
      ${shippingRow}
      <tr>
        <td style="padding:18px 0 0;font-family:${FONT_DISPLAY};font-size:13px;font-weight:600;letter-spacing:0.16em;text-transform:uppercase;color:${BEYAZ};border-top:1px solid ${LINE};">Toplam</td>
        <td style="padding:18px 0 0;font-family:${FONT_BODY};font-size:22px;font-weight:700;color:${BEYAZ};text-align:right;border-top:1px solid ${LINE};">${escapeHtml(formatTry(total))}</td>
      </tr>
    </table>`;
}

function orderPanel(order: OrderMailRow, isPickup: boolean): string {
  const pickup =
    isPickup && order.pickup_code
      ? `<tr>
          <td style="padding:14px 0 0;border-top:1px solid ${LINE};">
            <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Teslim kodu</div>
            <div style="margin-top:6px;font-family:${FONT_DISPLAY};font-size:28px;font-weight:700;letter-spacing:0.18em;color:${BEYAZ};">${escapeHtml(order.pickup_code)}</div>
          </td>
        </tr>`
      : "";
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border:1px solid ${LINE};">
      <tr>
        <td style="width:4px;background:${BORDO};font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding:20px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:14px;">
                <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Sipariş no</div>
                <div style="margin-top:6px;font-family:${FONT_DISPLAY};font-size:20px;font-weight:600;letter-spacing:0.04em;color:${BEYAZ};">${escapeHtml(order.order_number)}</div>
              </td>
              <td align="right" valign="top" style="padding-bottom:14px;">
                <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Teslimat</div>
                <div style="margin-top:6px;font-family:${FONT_BODY};font-size:14px;font-weight:500;color:${BEYAZ};">${escapeHtml(deliveryLabel(order))}</div>
              </td>
            </tr>
            ${pickup}
          </table>
        </td>
      </tr>
    </table>`;
}

function ctaButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
      <tr>
        <td style="border-radius:999px;background:${BORDO};">
          <a href="${escapeHtml(href)}" style="display:inline-block;padding:16px 32px;font-family:${FONT_BODY};font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BEYAZ};text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/**
 * gungorenspor.com hero dili:
 * siyah zemin, Oswald başlık, bordo vurgu, HİÇ VAZGEÇMEDİK manifesto.
 */
function wrapEmail(opts: {
  title: string;
  eyebrow: string;
  line1: string;
  line2: string;
  note: string;
  intro: string;
  order: OrderMailRow;
  items: OrderItemRow[];
  site: string;
}): string {
  const isPickup = opts.order.delivery_method === "store_pickup";
  const preheader = `${opts.line1} ${opts.line2} · ${opts.order.order_number}`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(opts.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style>body,table,td{font-family:Arial,sans-serif!important}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background:${SIYAH};font-family:${FONT_BODY};color:${BEYAZ};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SIYAH};">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" style="max-width:640px;background:${SIYAH};" cellpadding="0" cellspacing="0">

          <!-- Üst bar — site header -->
          <tr>
            <td style="padding:18px 28px 12px;border-bottom:1px solid ${LINE};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="middle">
                    <a href="${escapeHtml(opts.site)}" style="text-decoration:none;">
                      <img src="${SITE_LOGO}" width="132" height="52" alt="Güngören FK" style="display:block;height:48px;width:auto;max-width:150px;border:0;">
                    </a>
                  </td>
                  <td valign="middle" align="right">
                    <span style="font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">Mağaza</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero tipografi -->
          <tr>
            <td style="padding:40px 28px 8px;">
              <div style="font-family:${FONT_BODY};font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${BORDO};">${escapeHtml(opts.eyebrow)}</div>
              <h1 style="margin:18px 0 0;font-family:${FONT_DISPLAY};font-size:52px;line-height:0.92;font-weight:700;letter-spacing:-0.02em;text-transform:uppercase;color:${BEYAZ};">
                ${escapeHtml(opts.line1)}<br>
                <span style="color:${BORDO};">${escapeHtml(opts.line2)}</span>
              </h1>
              <p style="margin:22px 0 0;max-width:420px;font-family:${FONT_BODY};font-size:16px;font-weight:300;line-height:1.65;color:${MUTED};">${opts.intro}</p>
              <p style="margin:10px 0 0;font-family:${FONT_BODY};font-size:14px;line-height:1.55;color:rgba(255,255,255,0.4);">${escapeHtml(opts.note)}</p>
            </td>
          </tr>

          <!-- Sipariş paneli + ürünler -->
          <tr>
            <td style="padding:12px 28px 8px;">
              ${orderPanel(opts.order, isPickup)}
              ${renderItems(opts.items)}
              ${renderTotals(opts.order)}
              ${ctaButton(opts.site + "/magaza", "Mağazaya dön")}
              <p style="margin:18px 0 0;font-family:${FONT_BODY};font-size:13px;color:${MUTED};">Destek: ${supportLink()}</p>
            </td>
          </tr>

          <!-- Manifesto — site hero sloganı -->
          <tr>
            <td style="padding:48px 28px 36px;text-align:center;border-top:1px solid ${LINE};">
              <div style="font-family:${FONT_BODY};font-size:10px;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;">
                Güngören Belediye Spor Kulübü
              </div>
              <div style="font-family:${FONT_DISPLAY};font-size:42px;line-height:0.95;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BEYAZ};">
                Hiç<br>vazgeçmedik
              </div>
              <div style="margin:28px auto 0;width:64px;height:3px;background:${BORDO};font-size:0;line-height:0;">&nbsp;</div>
              <p style="margin:22px 0 0;font-family:${FONT_BODY};font-size:11px;letter-spacing:0.04em;color:rgba(255,255,255,0.35);">
                <a href="${escapeHtml(opts.site)}" style="color:rgba(255,255,255,0.55);text-decoration:none;">gungorenspor.com</a>
                &nbsp;·&nbsp; Otomatik sipariş bildirimi
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
      intro: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${name}</strong>, ödemeniz alındı.`,
      text: `Siparişiniz alındı (${no}). Tutar: ${total}. ${meta.note(isPickup)}`,
    };
  }
  if (kind === "shipped") {
    return {
      subject: isPickup ? `Teslime hazır — ${no}` : `Siparişiniz kargoda — ${no}`,
      intro: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${name}</strong>, siparişiniz hareketlendi.`,
      text: `${isPickup ? "Teslime hazır" : "Kargoda"} (${no}). ${meta.note(isPickup)}`,
    };
  }
  if (kind === "delivered") {
    return {
      subject: `Siparişiniz teslim edildi — ${no}`,
      intro: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${name}</strong>, teslimat tamamlandı.`,
      text: `Teslim edildi (${no}).`,
    };
  }
  return {
    subject: refunded ? `Sipariş iadesi — ${no}` : `Sipariş iptali — ${no}`,
    intro: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${name}</strong>, ${
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
  const html = wrapEmail({
    title: copy.subject,
    eyebrow: meta.eyebrow,
    line1: meta.line1(isPickup),
    line2: meta.line2(isPickup),
    note: meta.note(isPickup),
    intro: copy.intro,
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
