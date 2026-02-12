import { createClient } from "@supabase/supabase-js";

/**
 * Sadece sunucu tarafında kullanın. RLS bypass eder.
 * Admin kontrolü gibi işlemler için.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ve NEXT_PUBLIC_SUPABASE_URL gerekli.");
  return createClient(url, key);
}
