import { sendMail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-url";

const BORDO = "#8B1538";
const SIYAH = "#0A0A0A";
const BEYAZ = "#FFFFFF";
const MUTED = "#5a5a5a";
const PAGE_BG = "#f8f8f8";

const SITE_LOGO =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png";
const SLOGAN_IMG =
  "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-06.png";

const FONT_BODY = "'Outfit',system-ui,-apple-system,sans-serif";
const FONT_DISPLAY = "'Oswald',Arial,Helvetica,sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapAuthEmail(opts: { title: string; headline: string; bodyHtml: string; site: string }): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(opts.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${PAGE_BG};font-family:${FONT_BODY};color:${SIYAH};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAGE_BG};">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:${SIYAH};padding:10px 24px 8px;border-bottom:1px solid rgba(255,255,255,0.1);">
            <span style="font-family:${FONT_BODY};font-size:11px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Resmi internet sitesi</span>
          </td>
        </tr>
        <tr>
          <td style="background:${SIYAH};padding:14px 24px 16px;">
            <a href="${escapeHtml(opts.site)}" style="text-decoration:none;">
              <img src="${SITE_LOGO}" width="140" height="56" alt="Güngören FK" style="display:block;height:52px;width:auto;max-width:160px;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:${BEYAZ};padding:28px 24px;">
            <div style="font-family:${FONT_BODY};font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${BORDO};">Hesap</div>
            <h1 style="margin:12px 0 14px;font-family:${FONT_DISPLAY};font-size:32px;line-height:1.1;font-weight:700;color:${SIYAH};">${escapeHtml(opts.headline)}</h1>
            ${opts.bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="background:${SIYAH};padding:28px 24px;text-align:center;">
            <img src="${SLOGAN_IMG}" width="240" alt="Hiç vazgeçmedik" style="display:inline-block;width:240px;max-width:80%;height:auto;margin:0 auto 12px;">
            <div style="font-family:${FONT_DISPLAY};font-size:13px;font-weight:600;letter-spacing:0.28em;text-transform:uppercase;color:${BEYAZ};">Hiç vazgeçmedik</div>
            <div style="margin-top:12px;font-family:${FONT_BODY};font-size:11px;color:rgba(255,255,255,0.45);">
              <a href="${escapeHtml(opts.site)}" style="color:${BORDO};text-decoration:none;">gungorenspor.com</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Markalı şifre sıfırlama maili (Google SMTP). */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const site = getSiteUrl();
  const subject = "Şifre sıfırlama — Güngören FK";
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:16px;font-weight:300;line-height:1.6;color:${MUTED};">
      Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyin.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="border-radius:999px;background:${BORDO};">
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:14px 28px;font-family:${FONT_BODY};font-size:14px;font-weight:700;color:${BEYAZ};text-decoration:none;">Yeni şifre belirle</a>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">
      Bu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz. Link kısa süre sonra geçersiz olur.
    </p>
    <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#999;word-break:break-all;">
      Buton çalışmazsa: ${escapeHtml(resetUrl)}
    </p>
  `;
  const html = wrapAuthEmail({
    title: subject,
    headline: "Şifrenizi sıfırlayın",
    bodyHtml,
    site,
  });
  const text = `Şifre sıfırlama: ${resetUrl}\n\nBu talebi siz oluşturmadıysanız yok sayın.`;
  return sendMail({ to, subject, html, text });
}
