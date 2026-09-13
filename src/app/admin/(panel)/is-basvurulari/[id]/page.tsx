import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { JOB_APPLICATION_STATUS_LABELS, type JobApplicationStatus } from "@/lib/job-form";
import { JobApplicationStatusForm } from "../JobApplicationStatusForm";

export default async function AdminIsBasvuruDetayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data } = await supabase.from("job_applications").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const row = data as {
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
    user_id: string;
  };

  return (
    <div className="max-w-3xl">
      <Link href="/admin/is-basvurulari" className="text-sm text-bordo hover:underline">
        ← Başvuru listesi
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">{row.full_name}</h1>
      <p className="mt-1 text-sm text-siyah/60">
        {JOB_APPLICATION_STATUS_LABELS[row.status] ?? row.status} ·{" "}
        {new Date(row.created_at).toLocaleString("tr-TR")}
      </p>

      <dl className="mt-6 space-y-3 rounded-xl border border-siyah/10 bg-beyaz p-5 text-sm">
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Pozisyon</dt>
          <dd className="font-semibold text-siyah">{row.position_applied}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">E-posta</dt>
          <dd>
            <a href={`mailto:${row.email}`} className="text-bordo hover:underline">
              {row.email}
            </a>
          </dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Telefon</dt>
          <dd>
            <a href={`tel:${row.phone}`} className="text-bordo hover:underline">
              {row.phone}
            </a>
          </dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Doğum yılı</dt>
          <dd>{row.birth_year ?? "—"}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Şehir</dt>
          <dd>{row.city ?? "—"}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Eğitim</dt>
          <dd className="whitespace-pre-wrap">{row.education || "—"}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Deneyim</dt>
          <dd className="whitespace-pre-wrap leading-relaxed">{row.experience || "—"}</dd>
        </div>
        <div className="grid gap-1 sm:grid-cols-[8rem_1fr]">
          <dt className="font-medium text-siyah/55">Mesaj</dt>
          <dd className="whitespace-pre-wrap leading-relaxed">{row.message || "—"}</dd>
        </div>
      </dl>

      <JobApplicationStatusForm id={row.id} status={row.status} adminNotes={row.admin_notes} />
    </div>
  );
}
