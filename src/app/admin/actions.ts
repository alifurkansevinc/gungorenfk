"use server";

import { cookies } from "next/headers";
import { createServiceRoleClient } from "@/lib/supabase/service";

const BYPASS_COOKIE_NAME = "admin_bypass";
const BYPASS_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün

export type CheckAdminResult = { isAdmin: boolean; error?: string };

/**
 * Verilen user_id'nin admin_users'da olup olmadığını service role ile kontrol eder (RLS bypass).
 */
export async function checkIsAdmin(userId: string): Promise<CheckAdminResult> {
  if (!userId) return { isAdmin: false, error: "userId boş" };
  try {
    const admin = createServiceRoleClient();
    const { data, error } = await admin
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) return { isAdmin: false, error: error.message };
    return { isAdmin: !!data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY") || msg.includes("gerekli"))
      return { isAdmin: false, error: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil (Vercel/env)" };
    return { isAdmin: false, error: msg };
  }
}

/**
 * Geçici bypass: doğru kod girilirse admin cookie set edilir, Supabase kontrolü atlanır.
 * .env'de ADMIN_BYPASS_SECRET tanımla (örn. uzun rastgele bir string).
 */
export async function verifyBypass(code: string): Promise<{ ok: boolean; error?: string }> {
  const secret = process.env.ADMIN_BYPASS_SECRET;
  if (!secret) return { ok: false, error: "ADMIN_BYPASS_SECRET tanımlı değil" };
  if (code !== secret) return { ok: false, error: "Geçersiz bypass kodu" };
  const store = await cookies();
  store.set(BYPASS_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: BYPASS_MAX_AGE,
    path: "/",
  });
  return { ok: true };
}

/** Layout'ta bypass cookie geçerli mi kontrolü için. */
export async function hasValidBypass(): Promise<boolean> {
  const secret = process.env.ADMIN_BYPASS_SECRET;
  if (!secret) return false;
  const store = await cookies();
  const cookie = store.get(BYPASS_COOKIE_NAME);
  return cookie?.value === secret;
}
