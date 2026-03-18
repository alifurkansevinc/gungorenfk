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
 * Admin girişi: şifre doğrulanır, admin_users kontrol edilir; başarıda
 * bypass ile aynı cookie set edilir (Supabase session cookie'ye güvenmiyoruz).
 * .env'de ADMIN_BYPASS_SECRET tanımlı olmalı.
 */
export async function signInAdmin(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed || !password) return { ok: false, error: "E-posta ve şifre girin." };
  const secret = process.env.ADMIN_BYPASS_SECRET;
  if (!secret) return { ok: false, error: "Sunucu ayarı eksik: ADMIN_BYPASS_SECRET tanımlanmalı." };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: "Giriş başarısız." };
    const result = await checkIsAdmin(data.user.id);
    if (!result.isAdmin) {
      await supabase.auth.signOut();
      return {
        ok: false,
        error: result.error ? `Admin değil: ${result.error}` : "Bu hesap admin değil.",
      };
    }
    const store = await cookies();
    store.set(BYPASS_COOKIE_NAME, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: BYPASS_MAX_AGE,
      path: "/",
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

type AdminRole = "admin" | "operator" | "club_manager" | "football_director" | "event_coordinator";

/**
 * Yeni panel kullanıcısı ekler (e-posta + şifre + rol).
 * Şifre verilirse Supabase Auth'da kullanıcı oluşturulur; verilmezse mevcut kullanıcı aranır.
 * Sadece admin rolündeki kullanıcılar çağırabilir (sayfa seviyesinde kontrol).
 */
export async function addAdminUser(
  email: string,
  password: string | null,
  role: AdminRole
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "E-posta girin." };
  const validRoles: AdminRole[] = ["admin", "operator", "club_manager", "football_director", "event_coordinator"];
  if (!validRoles.includes(role)) return { ok: false, error: "Geçersiz rol." };
  try {
    const supabase = createServiceRoleClient();
    let userId: string;

    if (password && password.length >= 6) {
      const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
        email: trimmed,
        password,
        email_confirm: true,
      });
      if (createErr) {
        const isDuplicateEmail =
          createErr.message.toLowerCase().includes("already") ||
          createErr.message.toLowerCase().includes("duplicate") ||
          createErr.message.toLowerCase().includes("exists");
        if (!isDuplicateEmail) return { ok: false, error: createErr.message };
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (error) return { ok: false, error: error.message };
        const user = data?.users?.find((u) => u.email?.toLowerCase() === trimmed);
        if (!user) return { ok: false, error: "Bu e-posta ile kayıtlı kullanıcı bulunamadı." };
        userId = user.id;
      } else {
        if (!createData.user) return { ok: false, error: "Kullanıcı oluşturulamadı." };
        userId = createData.user.id;
      }
    } else {
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) return { ok: false, error: error.message };
      const user = data?.users?.find((u) => u.email?.toLowerCase() === trimmed);
      if (!user)
        return {
          ok: false,
          error: "Bu e-posta ile kayıtlı kullanıcı yok. Şifre girerek yeni kullanıcı oluşturabilirsiniz.",
        };
      userId = user.id;
    }

    const { data: existingAdmin, error: existingErr } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingErr) return { ok: false, error: existingErr.message };

    if (existingAdmin) {
      const { error: updateErr } = await supabase.from("admin_users").update({ role }).eq("id", existingAdmin.id);
      if (updateErr) return { ok: false, error: updateErr.message };
      return { ok: true };
    }

    const { error: insertErr } = await supabase.from("admin_users").insert({ user_id: userId, role }).select().single();
    if (insertErr) {
      if (insertErr.code === "23505") return { ok: false, error: "Bu kullanıcı zaten panele ekli." };
      return { ok: false, error: insertErr.message };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * E-posta ile yeni admin ekler (mevcut Auth kullanıcısı). Rol varsayılan admin.
 * Yeni kullanıcı + şifre + rol için addAdminUser kullanın.
 */
export async function addAdminByEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  return addAdminUser(email, null, "admin");
}

/**
 * En az bir panel kullanıcısı (admin) var mı? Giriş sayfasında ilk kullanıcı formunu göstermek için kullanılır.
 */
export async function hasAnyAdmin(): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();
    const { count, error } = await supabase.from("admin_users").select("id", { count: "exact", head: true });
    if (error) return false;
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * Hiç admin yokken ilk panel kullanıcısını oluşturur (giriş sayfasından çağrılır).
 * Sadece admin_users boşken çalışır; yoksa hata döner.
 */
export async function createFirstAdminUser(
  email: string,
  password: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "E-posta girin." };
  if (!password || password.length < 6) return { ok: false, error: "Şifre en az 6 karakter olmalı." };
  try {
    const supabase = createServiceRoleClient();
    const { count, error: countErr } = await supabase.from("admin_users").select("id", { count: "exact", head: true });
    if (countErr) return { ok: false, error: countErr.message };
    if ((count ?? 0) > 0) return { ok: false, error: "Zaten en az bir panel kullanıcısı var. Giriş yapın." };

    const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
      email: trimmed,
      password,
      email_confirm: true,
    });
    if (createErr) return { ok: false, error: createErr.message };
    if (!createData.user) return { ok: false, error: "Kullanıcı oluşturulamadı." };

    const { error: insertErr } = await supabase
      .from("admin_users")
      .insert({ user_id: createData.user.id, role: "admin" })
      .select()
      .single();
    if (insertErr) return { ok: false, error: insertErr.message };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * E-posta ile kullanıcı şifresini sıfırlar (Admin API). Sadece admin panelinden çağrılmalı.
 */
export async function resetUserPasswordByEmail(email: string, newPassword: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "E-posta girin." };
  if (!newPassword || newPassword.length < 6) return { ok: false, error: "Yeni şifre en az 6 karakter olmalı." };
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return { ok: false, error: error.message };
    const user = data?.users?.find((u) => u.email?.toLowerCase() === trimmed);
    if (!user) return { ok: false, error: "Bu e-posta ile kayıtlı kullanıcı bulunamadı." };
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateErr) return { ok: false, error: updateErr.message };
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
