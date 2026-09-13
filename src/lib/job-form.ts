/** İş başvuru formu ayarları (site_settings.job_form) */

export type JobFormSettings = {
  is_active: boolean;
  show_on_homepage: boolean;
  title: string;
  subtitle: string;
  description: string;
  positions: string[];
  success_message: string;
};

export const DEFAULT_JOB_FORM_SETTINGS: JobFormSettings = {
  is_active: true,
  show_on_homepage: true,
  title: "İş Başvurusu",
  subtitle: "Kulübümüzde çalışmak ister misin?",
  description:
    "Açık pozisyonlar için başvurunu buradan iletebilirsin. Yalnızca taraftar üyelerimiz başvuru yapabilir.",
  positions: ["İdari personel", "Saha / tesis", "Medya & içerik", "Pazarlama", "Diğer"],
  success_message: "Başvurun alındı. En kısa sürede seninle iletişime geçeceğiz.",
};

export type JobApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";

export const JOB_APPLICATION_STATUS_LABELS: Record<JobApplicationStatus, string> = {
  pending: "Yeni",
  reviewed: "İncelendi",
  shortlisted: "Ön seçildi",
  rejected: "Reddedildi",
  hired: "İşe alındı",
};

export function parseJobFormSettings(raw: unknown): JobFormSettings {
  const v = (raw && typeof raw === "object" ? raw : {}) as Partial<JobFormSettings>;
  const positions = Array.isArray(v.positions)
    ? v.positions.map((p) => String(p).trim()).filter(Boolean)
    : DEFAULT_JOB_FORM_SETTINGS.positions;
  return {
    is_active: v.is_active !== false,
    show_on_homepage: v.show_on_homepage !== false,
    title: (v.title ?? DEFAULT_JOB_FORM_SETTINGS.title).trim() || DEFAULT_JOB_FORM_SETTINGS.title,
    subtitle: (v.subtitle ?? DEFAULT_JOB_FORM_SETTINGS.subtitle).trim(),
    description: (v.description ?? DEFAULT_JOB_FORM_SETTINGS.description).trim(),
    positions: positions.length > 0 ? positions : DEFAULT_JOB_FORM_SETTINGS.positions,
    success_message:
      (v.success_message ?? DEFAULT_JOB_FORM_SETTINGS.success_message).trim() ||
      DEFAULT_JOB_FORM_SETTINGS.success_message,
  };
}
