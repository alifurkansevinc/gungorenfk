import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const MAX_QUANTITY = 500;

function generateQrCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TKT";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** Admin: Seçilen maç için N adet bilet oluşturur (QR kodlu). Koltuk bilgisi sonra eklenecek. */
export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const matchId = (body.matchId as string)?.trim();
  const quantity = Math.min(MAX_QUANTITY, Math.max(1, parseInt(String(body.quantity), 10) || 1));

  if (!matchId) return NextResponse.json({ success: false, error: "matchId gerekli" }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id")
    .eq("id", matchId)
    .single();
  if (matchError || !match) {
    return NextResponse.json({ success: false, error: "Maç bulunamadı." }, { status: 404 });
  }

  const rows: Array<{ match_id: string; qr_code: string; status: string; payment_status: string }> = [];
  const used = new Set<string>();

  for (let i = 0; i < quantity; i++) {
    let qrCode = generateQrCode();
    for (let attempt = 0; attempt < 10; attempt++) {
      if (!used.has(qrCode)) break;
      qrCode = generateQrCode();
    }
    used.add(qrCode);
    rows.push({
      match_id: matchId,
      qr_code: qrCode,
      status: "active",
      payment_status: "PENDING",
    });
  }

  const { error: insertError } = await supabase.from("match_tickets").insert(rows);
  if (insertError) {
    return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
  }
  return NextResponse.json({ success: true, created: quantity, message: `${quantity} bilet oluşturuldu.` });
}
