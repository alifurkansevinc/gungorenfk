import { sendMail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-url";
import { BRAND, escapeHtml, wrapBrandEmail } from "@/lib/brand-email";

const { siyah: SIYAH, muted: MUTED, fontBody } = BRAND;

/** Markalı şifre sıfırlama maili (Google SMTP). */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const site = getSiteUrl();
  const subject = "Şifre sıfırlama — Güngören FK";
  const bodyHtml = `
    <p style="margin:0 0 8px;font-family:${fontBody};font-size:15px;font-weight:600;line-height:1.6;color:${MUTED};">
      Hesabınız için şifre sıfırlama talebi aldık. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyin.
    </p>
    <p style="margin:16px 0 0;font-family:${fontBody};font-size:12px;font-weight:600;line-height:1.5;color:#999;word-break:break-all;">
      Buton çalışmazsa: ${escapeHtml(resetUrl)}
    </p>
    <p style="margin:16px 0 0;font-family:${fontBody};font-size:13px;font-weight:600;color:${MUTED};">
      Bu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz.
    </p>
  `;

  return sendMail({
    to,
    subject,
    html: wrapBrandEmail({
      title: subject,
      eyebrow: "Hesap",
      line1: "Şifrenizi",
      line2: "sıfırlayın",
      introHtml: `Merhaba, <strong style="color:${SIYAH};font-weight:800;">güvenliğiniz</strong> için link yalnızca kısa süre geçerlidir.`,
      bodyHtml,
      ctaHref: resetUrl,
      ctaLabel: "Yeni şifre belirle",
      preheader: "Şifre sıfırlama bağlantınız hazır",
    }),
    text: `Şifre sıfırlama: ${resetUrl}\n\nBu talebi siz oluşturmadıysanız yok sayın.`,
  });
}
