import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadOrderInvoicePdf } from "@/lib/uyum-invoice";

/** Admin: Kesilmiş faturanın PDF'ini Uyum'dan çeker. */
export async function GET(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { checkIsAdmin, hasValidBypass } = await import("@/app/admin/actions");
  const hasBypass = await hasValidBypass();
  const { isAdmin } = await checkIsAdmin(user.id);
  if (!isAdmin && !hasBypass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orderId = req.nextUrl.searchParams.get("orderId")?.trim() || "";
  if (!orderId) return NextResponse.json({ error: "orderId gerekli" }, { status: 400 });

  try {
    const kind = req.nextUrl.searchParams.get("kind") === "iade" ? "return" : "sale";
    const { number, pdf } = await loadOrderInvoicePdf(orderId, kind);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${number}.pdf"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fatura alınamadı";
    return new NextResponse(message, { status: 502, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
