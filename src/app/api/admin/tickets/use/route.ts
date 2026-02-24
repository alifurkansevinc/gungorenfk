import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Admin: Bilet QR kodu okutulunca bileti "kullanıldı" işaretle. */
export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const qrCode = (body.qr_code as string)?.trim();
  if (!qrCode) return NextResponse.json({ success: false, error: "qr_code gerekli" }, { status: 400 });

  const supabase = createServiceRoleClient();

  // Rozet teslim bileti (RZ- ile başlayan QR): mağazada rozet teslim alırken kullanılır, kullanıldıktan sonra Benim Köşemden düşer
  if (qrCode.startsWith("RZ-")) {
    const { data: rozetRow, error: rozetFindError } = await supabase
      .from("rozet_pickup_tickets")
      .select("id")
      .eq("qr_code", qrCode)
      .is("used_at", null)
      .single();

    if (rozetFindError || !rozetRow) {
      return NextResponse.json({ success: false, error: "Rozet teslim bileti bulunamadı veya zaten kullanılmış." }, { status: 404 });
    }

    const { error: rozetUpdateError } = await supabase
      .from("rozet_pickup_tickets")
      .update({ used_at: new Date().toISOString() })
      .eq("id", rozetRow.id);

    if (rozetUpdateError) {
      return NextResponse.json({ success: false, error: rozetUpdateError.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: "Rozet teslim bileti kullanıldı." });
  }

  const { data: ticket, error: findError } = await supabase
    .from("match_tickets")
    .select("id, status, payment_status")
    .eq("qr_code", qrCode)
    .single();

  if (findError || !ticket) {
    return NextResponse.json({ success: false, error: "Bilet bulunamadı." }, { status: 404 });
  }
  if (ticket.status !== "active") {
    return NextResponse.json({ success: false, error: "Bu bilet zaten kullanılmış." }, { status: 400 });
  }
  if ((ticket as { payment_status?: string }).payment_status !== "PAID") {
    return NextResponse.json({ success: false, error: "Bu bilet ödeme onayı almamış." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("match_tickets")
    .update({ status: "used", used_at: new Date().toISOString() })
    .eq("id", ticket.id);

  if (updateError) {
    return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, message: "Bilet kullanıldı." });
}
