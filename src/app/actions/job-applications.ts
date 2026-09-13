"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminSupabase } from "@/app/admin/actions";
import { parseJobFormSettings, type JobApplicationStatus, type JobFormSettings } from "@/lib/job-form";

export type SubmitJobApplicationResult = { ok: true } | { error: string };

export async function getJobFormSettings(): Promise<JobFormSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "job_form").maybeSingle();
  return parseJobFormSettings(data?.value);
}

export async function submitJobApplication(formData: FormData): Promise<SubmitJobApplicationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Başvuru için taraftar girişi gerekir." };
  }

  const { data: profile } = await supabase
    .from("fan_profiles")
    .select("id, first_name, last_name, email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return { error: "Başvuru için taraftar profili gerekir. Lütfen önce profilini tamamla." };
  }

  const settings = await getJobFormSettings();
  if (!settings.is_active) {
    return { error: "İş başvuruları şu an kapalı." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const birth_year_raw = String(formData.get("birth_year") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const position_applied = String(formData.get("position_applied") ?? "").trim();
  const education = String(formData.get("education") ?? "").trim();
  const experience = String(formData.get("experience") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!full_name || full_name.length < 3) return { error: "Ad soyad zorunludur." };
  if (!email || !email.includes("@")) return { error: "Geçerli bir e-posta girin." };
  if (!phone || phone.length < 10) return { error: "Geçerli bir telefon girin." };
  if (!position_applied) return { error: "Başvurulan pozisyonu seçin." };
  if (!experience || experience.length < 20) {
    return { error: "Deneyim / özgeçmiş alanını en az birkaç cümle yazın." };
  }

  const birth_year = birth_year_raw ? parseInt(birth_year_raw, 10) : null;
  if (birth_year != null && (Number.isNaN(birth_year) || birth_year < 1950 || birth_year > new Date().getFullYear() - 15)) {
    return { error: "Doğum yılı geçersiz." };
  }

  const { count } = await supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if ((count ?? 0) >= 3) {
    return { error: "Kısa süre içinde çok fazla başvuru yaptın. Lütfen yanıt bekle." };
  }

  const { error } = await supabase.from("job_applications").insert({
    user_id: user.id,
    full_name,
    email,
    phone,
    birth_year,
    city: city || null,
    position_applied,
    education: education || null,
    experience,
    message: message || null,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/is-basvuru");
  revalidatePath("/admin/is-basvurulari");
  return { ok: true };
}

export async function updateJobFormSettings(formData: FormData): Promise<{ ok: true } | { error: string }> {
  const s = await getAdminSupabase();
  const positionsRaw = String(formData.get("positions") ?? "");
  const positions = positionsRaw
    .split(/\n|,/)
    .map((p) => p.trim())
    .filter(Boolean);

  const value: JobFormSettings = {
    is_active: formData.get("is_active") === "on" || formData.get("is_active") === "true",
    show_on_homepage: formData.get("show_on_homepage") === "on" || formData.get("show_on_homepage") === "true",
    title: String(formData.get("title") ?? "").trim() || "İş Başvurusu",
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    positions: positions.length > 0 ? positions : ["Diğer"],
    success_message: String(formData.get("success_message") ?? "").trim() || "Başvurun alındı.",
  };

  const { error } = await s.from("site_settings").upsert(
    {
      key: "job_form",
      value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/is-basvuru");
  revalidatePath("/admin/is-basvurulari");
  return { ok: true };
}

export async function updateJobApplicationStatus(
  id: string,
  status: JobApplicationStatus,
  adminNotes?: string,
): Promise<{ ok: true } | { error: string }> {
  const s = await getAdminSupabase();
  const patch: { status: string; admin_notes?: string | null; updated_at: string } = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (adminNotes !== undefined) patch.admin_notes = adminNotes.trim() || null;

  const { error } = await s.from("job_applications").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/is-basvurulari");
  revalidatePath(`/admin/is-basvurulari/${id}`);
  return { ok: true };
}
