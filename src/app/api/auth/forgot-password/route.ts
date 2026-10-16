import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { sendPasswordResetEmail } from "@/lib/auth-emails";
import { getSiteUrl } from "@/lib/site-url";

const GENERIC_OK =
  "E-posta adresiniz sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutusu ve spam klasörünü kontrol edin.";

/**
 * Şifremi unuttum: Supabase recovery token üretir, markalı maili Google SMTP ile yollar.
 * POST { email: string, next?: "/taraftar/giris" | "/admin/giris" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const nextRaw = typeof body.next === "string" ? body.next.trim() : "/taraftar/giris";
  const next =
    nextRaw === "/admin/giris" || nextRaw.startsWith("/admin/")
      ? "/admin/giris"
      : "/taraftar/giris";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli bir e-posta girin." }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleClient();
    const site = getSiteUrl();
    const redirectTo = `${site}/auth/callback?next=${encodeURIComponent(next)}`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });

    if (error || !data) {
      // Kullanıcı yok / rate limit — yine de aynı mesaj (enumeration önleme)
      console.warn("[forgot-password]", error?.message || "generateLink boş");
      return NextResponse.json({ success: true, message: GENERIC_OK });
    }

    const hashed =
      (data as { properties?: { hashed_token?: string } }).properties?.hashed_token ||
      (data as { hashed_token?: string }).hashed_token;
    const actionLink = (data as { properties?: { action_link?: string } }).properties?.action_link;

    let resetUrl: string | null = null;
    if (hashed) {
      resetUrl = `${site}/auth/callback?token_hash=${encodeURIComponent(hashed)}&type=recovery&next=${encodeURIComponent(next)}`;
    } else if (actionLink) {
      resetUrl = actionLink;
    }

    if (!resetUrl) {
      console.warn("[forgot-password] link üretilemedi");
      return NextResponse.json({ success: true, message: GENERIC_OK });
    }

    const sent = await sendPasswordResetEmail(email, resetUrl);
    if (!sent.ok && !sent.skipped) {
      console.error("[forgot-password] mail:", sent.error);
      return NextResponse.json(
        { error: "E-posta gönderilemedi. Lütfen biraz sonra tekrar deneyin." },
        { status: 502 }
      );
    }
    if (sent.skipped) {
      console.error("[forgot-password] SMTP yapılandırılmamış");
      return NextResponse.json(
        { error: "E-posta servisi yapılandırılmamış. Yöneticiye bildirin." },
        { status: 503 }
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_OK });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Beklenmeyen hata. Tekrar deneyin." }, { status: 500 });
  }
}
