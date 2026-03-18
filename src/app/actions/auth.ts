"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const ADMIN_BYPASS_COOKIE_NAME = "admin_bypass";

export async function signOutCurrentUser() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const store = await cookies();
  store.delete(ADMIN_BYPASS_COOKIE_NAME);
}
