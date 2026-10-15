import nodemailer from "nodemailer";

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function mailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

/** SMTP yoksa sessizce atlar (deploy kırılmaz). */
export async function sendMail(input: SendMailInput): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!mailConfigured()) {
    console.warn("[mail] SMTP env eksik; mail atlandı:", input.subject);
    return { ok: false, skipped: true, error: "SMTP yapılandırılmamış" };
  }

  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim().replace(/\s+/g, "");
  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "bilgi@gungorenspor.com";
  const fromName = process.env.MAIL_FROM_NAME?.trim() || "Güngören Spor";

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mail] gönderim hatası:", message);
    return { ok: false, error: message };
  }
}
