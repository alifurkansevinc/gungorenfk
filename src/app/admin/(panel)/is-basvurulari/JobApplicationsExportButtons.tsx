"use client";

import { FileDown, FileSpreadsheet } from "lucide-react";

export function JobApplicationsExportButtons({ durum }: { durum?: string }) {
  const qs = durum ? `?durum=${encodeURIComponent(durum)}` : "";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`/api/admin/job-applications/export/excel${qs}`}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-siyah/15 bg-beyaz px-3 py-2 text-sm font-semibold text-siyah hover:bg-siyah/5"
      >
        <FileSpreadsheet className="h-4 w-4 text-green-700" aria-hidden />
        Excel indir
      </a>
      <button
        type="button"
        onClick={() => {
          window.open(`/api/admin/job-applications/export/pdf${qs}`, "_blank", "noopener,noreferrer");
        }}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-siyah/15 bg-beyaz px-3 py-2 text-sm font-semibold text-siyah hover:bg-siyah/5"
      >
        <FileDown className="h-4 w-4 text-bordo" aria-hidden />
        PDF yazdır / kaydet
      </button>
    </div>
  );
}
