import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";
import { getJobFormSettings } from "@/app/actions/job-applications";
import { JOB_APPLICATION_STATUS_LABELS, type JobApplicationStatus } from "@/lib/job-form";
import { JobFormSettingsForm } from "./JobFormSettingsForm";

export default async function AdminIsBasvurulariPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>;
}) {
  const { durum } = await searchParams;
  const supabase = await getAdminSupabase();
  const settings = await getJobFormSettings();

  let q = supabase
    .from("job_applications")
    .select("id, full_name, email, phone, position_applied, status, created_at, city")
    .order("created_at", { ascending: false })
    .limit(200);

  if (durum && durum in JOB_APPLICATION_STATUS_LABELS) {
    q = q.eq("status", durum);
  }

  const { data: rows, error } = await q;

  const statusFilters: { key: string; label: string }[] = [
    { key: "", label: "Tümü" },
    ...Object.entries(JOB_APPLICATION_STATUS_LABELS).map(([key, label]) => ({ key, label })),
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-siyah">İş başvuruları</h1>
          <p className="mt-1 text-sm text-siyah/65">
            Form metinlerini düzenle, gelen başvuruları incele.{" "}
            <Link href="/is-basvuru" target="_blank" className="text-bordo hover:underline">
              Public sayfa →
            </Link>
          </p>
        </div>
        <p className="text-sm text-siyah/55">
          Form:{" "}
          <span className={settings.is_active ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
            {settings.is_active ? "Açık" : "Kapalı"}
          </span>
          {settings.show_on_homepage ? " · Anasayfada" : ""}
        </p>
      </div>

      <div className="mt-8 max-w-2xl">
        <JobFormSettingsForm initial={settings} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-siyah">Gelen başvurular</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {statusFilters.map((f) => {
            const active = (durum ?? "") === f.key;
            const href = f.key ? `/admin/is-basvurulari?durum=${f.key}` : "/admin/is-basvurulari";
            return (
              <Link
                key={f.key || "all"}
                href={href}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  active ? "bg-bordo text-beyaz" : "border border-siyah/15 bg-beyaz text-siyah/70 hover:bg-siyah/5"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Tablo henüz yok olabilir. Supabase&apos;de migration{" "}
            <code className="rounded bg-amber-100 px-1">067_job_applications.sql</code> çalıştırın. ({error.message})
          </p>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-siyah/10 bg-beyaz">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-siyah/5 text-siyah/70">
              <tr>
                <th className="px-3 py-2 font-medium">Ad</th>
                <th className="px-3 py-2 font-medium">Pozisyon</th>
                <th className="px-3 py-2 font-medium">İletişim</th>
                <th className="px-3 py-2 font-medium">Durum</th>
                <th className="px-3 py-2 font-medium">Tarih</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-siyah/50">
                    Henüz başvuru yok.
                  </td>
                </tr>
              ) : (
                (rows ?? []).map((r) => {
                  const row = r as {
                    id: string;
                    full_name: string;
                    email: string;
                    phone: string;
                    position_applied: string;
                    status: JobApplicationStatus;
                    created_at: string;
                    city: string | null;
                  };
                  return (
                    <tr key={row.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                      <td className="px-3 py-2.5 font-medium text-siyah">
                        {row.full_name}
                        {row.city ? <span className="block text-xs text-siyah/50">{row.city}</span> : null}
                      </td>
                      <td className="px-3 py-2.5">{row.position_applied}</td>
                      <td className="px-3 py-2.5 text-xs text-siyah/70">
                        <div>{row.email}</div>
                        <div>{row.phone}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-full bg-siyah/5 px-2 py-0.5 text-xs font-semibold">
                          {JOB_APPLICATION_STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-siyah/55 tabular-nums">
                        {new Date(row.created_at).toLocaleString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link href={`/admin/is-basvurulari/${row.id}`} className="font-medium text-bordo hover:underline">
                          Detay
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
