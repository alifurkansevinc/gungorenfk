import { getSiteUrl } from "@/lib/site-url";

export const BRAND = {
  bordo: "#8B1538",
  siyah: "#0A0A0A",
  beyaz: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  line: "rgba(255,255,255,0.12)",
  logo: "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png",
  fontBody: "'Outfit',system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
  fontDisplay: "'Oswald',Arial,Helvetica,sans-serif",
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
  const { bordo: BORDO, siyah: SIYAH, beyaz: BEYAZ, muted: MUTED, line: LINE, logo, fontBody, fontDisplay } = BRAND;
  const cta =
    opts.ctaHref && opts.ctaLabel
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
          <tr>
            <td style="border-radius:999px;background:${BORDO};">
              <a href="${escapeHtml(opts.ctaHref)}" style="display:inline-block;padding:16px 32px;font-family:${fontBody};font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BEYAZ};text-decoration:none;">${escapeHtml(opts.ctaLabel)}</a>
            </td>
          </tr>
        </table>`
      : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${escapeHtml(opts.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${SIYAH};font-family:${fontBody};color:${BEYAZ};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader || `${opts.line1} ${opts.line2}`)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SIYAH};">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:640px;background:${SIYAH};" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:18px 28px 12px;border-bottom:1px solid ${LINE};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <a href="${escapeHtml(site)}" style="text-decoration:none;">
                    <img src="${logo}" width="132" height="52" alt="Güngören FK" style="display:block;height:48px;width:auto;max-width:150px;border:0;">
                  </a>
                </td>
                <td align="right">
                  <span style="font-family:${fontBody};font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">Güngören FK</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 28px 8px;">
            <div style="font-family:${fontBody};font-size:11px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${BORDO};">${escapeHtml(opts.eyebrow)}</div>
            <h1 style="margin:18px 0 0;font-family:${fontDisplay};font-size:48px;line-height:0.92;font-weight:700;letter-spacing:-0.02em;text-transform:uppercase;color:${BEYAZ};">
              ${escapeHtml(opts.line1)}<br>
              <span style="color:${BORDO};">${escapeHtml(opts.line2)}</span>
            </h1>
            <div style="margin:22px 0 0;font-family:${fontBody};font-size:16px;font-weight:300;line-height:1.65;color:${MUTED};">${opts.introHtml}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 28px 8px;">
            ${opts.bodyHtml}
            ${cta}
          </td>
        </tr>
        <tr>
          <td style="padding:48px 28px 36px;text-align:center;border-top:1px solid ${LINE};">
            <div style="font-family:${fontBody};font-size:10px;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;">Güngören Belediye Spor Kulübü</div>
            <div style="font-family:${fontDisplay};font-size:40px;line-height:0.95;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BEYAZ};">Hiç<br>vazgeçmedik</div>
            <div style="margin:28px auto 0;width:64px;height:3px;background:${BORDO};font-size:0;">&nbsp;</div>
            <p style="margin:22px 0 0;font-family:${fontBody};font-size:11px;color:rgba(255,255,255,0.35);">
              <a href="${escapeHtml(site)}" style="color:rgba(255,255,255,0.55);text-decoration:none;">gungorenspor.com</a>
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
  const { beyaz: BEYAZ, muted: MUTED, line: LINE, bordo: BORDO, fontBody, fontDisplay } = BRAND;
  const inner = rows
    .map(
      (r, i) => `<tr>
      <td style="padding:${i === 0 ? "0" : "14px"} 0 ${i === rows.length - 1 ? "0" : "14px"};${i > 0 ? `border-top:1px solid ${LINE};` : ""}">
        <div style="font-family:${fontBody};font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">${escapeHtml(r.label)}</div>
        <div style="margin-top:6px;font-family:${r.large ? fontDisplay : fontBody};font-size:${r.large ? "24px" : "15px"};font-weight:${r.large ? "700" : "600"};letter-spacing:${r.large ? "0.12em" : "0"};color:${BEYAZ};">${escapeHtml(r.value)}</div>
      </td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;border:1px solid ${LINE};">
    <tr>
      <td style="width:4px;background:${BORDO};font-size:0;">&nbsp;</td>
      <td style="padding:20px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table></td>
    </tr>
  </table>`;
}
