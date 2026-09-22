import { JOB_APPLICATION_STATUS_LABELS, type JobApplicationStatus } from "@/lib/job-form";
import type { SupabaseClient } from "@supabase/supabase-js";

export type JobApplicationExportRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  birth_year: number | null;
  city: string | null;
  position_applied: string;
  education: string | null;
  experience: string | null;
  message: string | null;
  status: JobApplicationStatus;
  admin_notes: string | null;
  created_at: string;
};

export async function fetchJobApplicationsForExport(
  supabase: SupabaseClient,
  durum?: string | null,
): Promise<JobApplicationExportRow[]> {
  let q = supabase
    .from("job_applications")
    .select(
      "id, full_name, email, phone, birth_year, city, position_applied, education, experience, message, status, admin_notes, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(2000);

  if (durum && durum in JOB_APPLICATION_STATUS_LABELS) {
    q = q.eq("status", durum);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as JobApplicationExportRow[];
}

export function formatJobApplicationDate(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function jobApplicationsToSheetRows(rows: JobApplicationExportRow[]) {
  return rows.map((r, i) => ({
    No: i + 1,
    AdSoyad: r.full_name,
    Email: r.email,
    Telefon: r.phone,
    DogumYili: r.birth_year ?? "",
    Sehir: r.city ?? "",
    Pozisyon: r.position_applied,
    Egitim: r.education ?? "",
    Deneyim: r.experience ?? "",
    Mesaj: r.message ?? "",
    Durum: JOB_APPLICATION_STATUS_LABELS[r.status] ?? r.status,
    AdminNotu: r.admin_notes ?? "",
    BasvuruTarihi: formatJobApplicationDate(r.created_at),
  }));
}

export function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
