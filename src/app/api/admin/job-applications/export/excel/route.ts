import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  fetchJobApplicationsForExport,
  jobApplicationsToSheetRows,
} from "@/lib/job-applications-export";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/job-form";

export const runtime = "nodejs";

/** Admin: iş başvuruları Excel (.xlsx) çıktısı */
export async function GET(req: NextRequest) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { checkIsAdmin, hasValidBypass } = await import("@/app/admin/actions");
  const hasBypass = await hasValidBypass();
  const { isAdmin } = await checkIsAdmin(user.id);
  if (!isAdmin && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const durum = req.nextUrl.searchParams.get("durum");
  try {
    const svc = createServiceRoleClient();
    const rows = await fetchJobApplicationsForExport(svc, durum);
    const sheetRows = jobApplicationsToSheetRows(rows);
    const ws = XLSX.utils.json_to_sheet(
      sheetRows.length > 0
        ? sheetRows
        : [
            {
              No: "",
              AdSoyad: "",
              Email: "",
              Telefon: "",
              DogumYili: "",
              Sehir: "",
              Pozisyon: "",
              Egitim: "",
              Deneyim: "",
              Mesaj: "",
              Durum: "",
              AdminNotu: "",
              BasvuruTarihi: "",
            },
          ],
    );
    ws["!cols"] = [
      { wch: 5 },
      { wch: 22 },
      { wch: 28 },
      { wch: 16 },
      { wch: 10 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
      { wch: 40 },
      { wch: 30 },
      { wch: 12 },
      { wch: 24 },
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Basvurular");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

    const stamp = new Date().toISOString().slice(0, 10);
    const statusLabel =
      durum && durum in JOB_APPLICATION_STATUS_LABELS
        ? `-${JOB_APPLICATION_STATUS_LABELS[durum as keyof typeof JOB_APPLICATION_STATUS_LABELS]}`
        : "";
    const filename = `is-basvurulari${statusLabel}-${stamp}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Excel oluşturulamadı" },
      { status: 500 },
    );
  }
}
