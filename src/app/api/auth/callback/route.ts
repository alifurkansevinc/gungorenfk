import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Şifre sıfırlama linki bu API'ye düşer (?code=...).
 * Code verifier cookie'de olduğu için exchange sunucuda yapılır (PKCE).
 * Supabase Redirect URL: https://siteniz.com/api/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/auth/callback", request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/callback?error=exchange", request.url));
}
