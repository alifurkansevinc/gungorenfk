import { getSiteUrl } from "@/lib/site-url";

/** Ortak marka — beyaz zemin, kalın modern tipografi, slogan görseli */
export const BRAND = {
  bordo: "#8B1538",
  siyah: "#0A0A0A",
  beyaz: "#FFFFFF",
  muted: "#5c5c5c",
  line: "rgba(10,10,10,0.1)",
  pageBg: "#f4f4f4",
  logo: "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png",
  slogan: "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-06.png",
  fontBody: "'Manrope',system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
  fontDisplay: "'Archivo Black','Arial Black',Arial,sans-serif",
} as const;

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatTry(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
}

export function wrapBrandEmail(opts: {
  title: string;
  eyebrow: string;
  line1: string;
  line2: string;
  introHtml: string;
  bodyHtml: string;
  ctaHref?: string;
  ctaLabel?: string;
  preheader?: string;
}): string {
  const site = getSiteUrl();
  const {
    bordo: BORDO,
    siyah: SIYAH,
    beyaz: BEYAZ,
    muted: MUTED,
    line: LINE,
    pageBg: PAGE_BG,
    logo,
    slogan,
    fontBody,
    fontDisplay,
  } = BRAND;

  const cta =
    opts.ctaHref && opts.ctaLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
          <tr>
            <td style="border-radius:999px;background:${BORDO};">
              <a href="${escapeHtml(opts.ctaHref)}" style="display:inline-block;padding:16px 32px;font-family:${fontBody};font-size:14px;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;color:${BEYAZ};text-decoration:none;">${escapeHtml(opts.ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(opts.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:${fontBody};color:${SIYAH};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader || `${opts.line1} ${opts.line2}`)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:640px;background:${BEYAZ};border:1px solid ${LINE};" cellpadding="0" cellspacing="0">

        <!-- Header: kulüp logosu + slogan logosu -->
        <tr>
          <td style="padding:22px 28px 18px;border-bottom:1px solid ${LINE};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="middle" style="width:50%;">
                  <a href="${escapeHtml(site)}" style="text-decoration:none;">
                    <img src="${logo}" width="140" height="56" alt="Güngören FK" style="display:block;height:52px;width:auto;max-width:150px;border:0;">
                  </a>
                </td>
                <td valign="middle" align="right" style="width:50%;">
                  <img src="${slogan}" width="168" height="56" alt="Hiç vazgeçmedik" style="display:inline-block;height:44px;width:auto;max-width:180px;border:0;">
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Başlık -->
        <tr>
          <td style="padding:36px 28px 8px;">
            <div style="font-family:${fontBody};font-size:12px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:${BORDO};">${escapeHtml(opts.eyebrow)}</div>
            <h1 style="margin:14px 0 0;font-family:${fontDisplay};font-size:42px;line-height:0.95;font-weight:400;letter-spacing:-0.02em;text-transform:uppercase;color:${SIYAH};">
              ${escapeHtml(opts.line1)}<br>
              <span style="color:${BORDO};">${escapeHtml(opts.line2)}</span>
            </h1>
            <div style="margin:20px 0 0;font-family:${fontBody};font-size:16px;font-weight:600;line-height:1.6;color:${MUTED};">${opts.introHtml}</div>
          </td>
        </tr>

        <!-- İçerik -->
        <tr>
          <td style="padding:12px 28px 8px;">
            ${opts.bodyHtml}
            ${cta}
          </td>
        </tr>

        <!-- Footer: slogan logo merkez -->
        <tr>
          <td style="padding:36px 28px 32px;text-align:center;border-top:1px solid ${LINE};">
            <img src="${slogan}" width="260" height="86" alt="Hiç vazgeçmedik" style="display:inline-block;width:260px;max-width:78%;height:auto;margin:0 auto 10px;border:0;">
            <p style="margin:14px 0 0;font-family:${fontBody};font-size:12px;font-weight:700;letter-spacing:0.04em;color:${MUTED};">
              <a href="${escapeHtml(site)}" style="color:${BORDO};text-decoration:none;font-weight:800;">gungorenspor.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function metaPanel(rows: Array<{ label: string; value: string; large?: boolean }>): string {
  const { siyah: SIYAH, muted: MUTED, line: LINE, bordo: BORDO, fontBody, fontDisplay } = BRAND;
  const inner = rows
    .map(
      (r, i) => `<tr>
      <td style="padding:${i === 0 ? "0" : "14px"} 0 ${i === rows.length - 1 ? "0" : "14px"};${i > 0 ? `border-top:1px solid ${LINE};` : ""}">
        <div style="font-family:${fontBody};font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">${escapeHtml(r.label)}</div>
        <div style="margin-top:6px;font-family:${r.large ? fontDisplay : fontBody};font-size:${r.large ? "22px" : "15px"};font-weight:${r.large ? "400" : "800"};letter-spacing:${r.large ? "0.08em" : "0"};color:${SIYAH};">${escapeHtml(r.value)}</div>
      </td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border:1px solid ${LINE};background:#fafafa;">
    <tr>
      <td style="width:4px;background:${BORDO};font-size:0;">&nbsp;</td>
      <td style="padding:20px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table></td>
    </tr>
  </table>`;
}
