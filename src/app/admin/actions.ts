"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
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

/**
 * Admin sayfalarında kullan: bypass ise service role (RLS yok), değilse session client.
 * Böylece bypass ile girişte de taraftar/maç/kadro vb. veriler görünür.
 */
export async function getAdminSupabase() {
  const bypass = await hasValidBypass();
  if (bypass) return createServiceRoleClient();
  return createClient();
}

/**
 * E-posta ile yeni admin ekler. Sadece mevcut admin tarafından çağrılmalı.
 * Kullanıcı önce Supabase Auth'da kayıtlı olmalı (site üzerinden veya Dashboard'dan).
 */
export async function addAdminByEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "E-posta girin." };
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return { ok: false, error: error.message };
    const user = data?.users?.find((u) => u.email?.toLowerCase() === trimmed);
    if (!user) return { ok: false, error: "Bu e-posta ile kayıtlı kullanıcı bulunamadı. Önce site veya Supabase Auth üzerinden kayıt olmalı." };
    const { error: insertErr } = await supabase.from("admin_users").insert({ user_id: user.id }).select().single();
    if (insertErr) {
      if (insertErr.code === "23505") return { ok: false, error: "Bu kullanıcı zaten admin." };
      return { ok: false, error: insertErr.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
