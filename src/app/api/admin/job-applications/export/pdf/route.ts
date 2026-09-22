import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  escapeHtml,
  fetchJobApplicationsForExport,
  formatJobApplicationDate,
} from "@/lib/job-applications-export";
import { JOB_APPLICATION_STATUS_LABELS, type JobApplicationStatus } from "@/lib/job-form";

export const runtime = "nodejs";

/** Admin: yazdırılabilir HTML (tarayıcıdan PDF kaydet) */
export async function GET(req: NextRequest) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { checkIsAdmin, hasValidBypass } = await import("@/app/admin/actions");
  const hasBypass = await hasValidBypass();
  const { isAdmin } = await checkIsAdmin(user.id);
  if (!isAdmin && !hasBypass) return new NextResponse("Forbidden", { status: 403 });

  const durum = req.nextUrl.searchParams.get("durum");
  try {
    const rows = await fetchJobApplicationsForExport(createServiceRoleClient(), durum);
    const filterLabel =
      durum && durum in JOB_APPLICATION_STATUS_LABELS
        ? JOB_APPLICATION_STATUS_LABELS[durum as JobApplicationStatus]
        : "Tümü";
    const generatedAt = new Date().toLocaleString("tr-TR");

    const bodyRows =
      rows.length === 0
        ? `<tr><td colspan="9" style="text-align:center;padding:16px">Bu filtrede başvuru yok.</td></tr>`
        : rows
            .map((r, i) => {
              const status = JOB_APPLICATION_STATUS_LABELS[r.status] ?? r.status;
              const exp = (r.experience ?? "").slice(0, 280);
              return `<tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(r.full_name)}</td>
                <td>${escapeHtml(r.position_applied)}</td>
                <td>${escapeHtml(r.email)}</td>
                <td>${escapeHtml(r.phone)}</td>
                <td>${escapeHtml(r.city ?? "—")}</td>
                <td>${escapeHtml(status)}</td>
                <td>${escapeHtml(formatJobApplicationDate(r.created_at))}</td>
                <td class="exp">${escapeHtml(exp)}</td>
              </tr>`;
            })
            .join("");

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>İş Başvuruları — ${escapeHtml(filterLabel)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      color: #0a0a0a; margin: 0; padding: 16px; font-size: 11px; line-height: 1.35;
    }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { color: #555; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 5px 6px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #f3f3f3; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    .exp { max-width: 220px; white-space: pre-wrap; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 14px; }
    .toolbar button {
      appearance: none; border: 1px solid #8B1538; background: #8B1538; color: #fff;
      font-weight: 600; padding: 8px 14px; border-radius: 8px; cursor: pointer;
    }
    .toolbar button.secondary { background: #fff; color: #8B1538; }
    @media print { .toolbar { display: none !important; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="window.print()">PDF olarak kaydet / Yazdır</button>
    <button type="button" class="secondary" onclick="window.close()">Kapat</button>
  </div>
  <h1>Güngören FK — İş Başvuruları</h1>
  <p class="meta">Filtre: <strong>${escapeHtml(filterLabel)}</strong> · ${rows.length} kayıt · Oluşturulma: ${escapeHtml(generatedAt)}</p>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Ad Soyad</th><th>Pozisyon</th><th>E-posta</th><th>Telefon</th>
        <th>Şehir</th><th>Durum</th><th>Tarih</th><th>Deneyim</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <script>window.addEventListener('load',function(){setTimeout(function(){window.print()},350);});</script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "PDF oluşturulamadı" },
      { status: 500 },
    );
  }
}
