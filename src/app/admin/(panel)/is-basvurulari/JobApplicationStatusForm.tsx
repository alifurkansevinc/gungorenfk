"use client";

import { useTransition } from "react";
import { updateJobApplicationStatus } from "@/app/actions/job-applications";
import {
  JOB_APPLICATION_STATUS_LABELS,
  type JobApplicationStatus,
} from "@/lib/job-form";

const STATUSES = Object.keys(JOB_APPLICATION_STATUS_LABELS) as JobApplicationStatus[];

export function JobApplicationStatusForm({
  id,
  status,
  adminNotes,
}: {
  id: string;
  status: JobApplicationStatus;
  adminNotes: string | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4 rounded-xl border border-siyah/10 bg-beyaz p-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const next = String(fd.get("status")) as JobApplicationStatus;
        const notes = String(fd.get("admin_notes") ?? "");
        startTransition(async () => {
          const res = await updateJobApplicationStatus(id, next, notes);
          if ("error" in res) {
            window.alert(res.error);
            return;
          }
          window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: "Başvuru güncellendi." } }));
          window.location.reload();
        });
      }}
    >
      <h2 className="text-sm font-semibold text-siyah">Durum & not</h2>
      <div>
        <label className="block text-xs font-medium text-siyah/70" htmlFor="status">
          Durum
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {JOB_APPLICATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-siyah/70" htmlFor="admin_notes">
          Admin notu (yalnızca panelde görünür)
        </label>
        <textarea
          id="admin_notes"
          name="admin_notes"
          rows={3}
          defaultValue={adminNotes ?? ""}
          className="mt-1 w-full rounded border border-siyah/20 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-60"
      >
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
