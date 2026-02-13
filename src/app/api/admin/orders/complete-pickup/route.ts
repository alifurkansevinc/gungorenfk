import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Admin: QR/kod ile mağazadan teslim alındı olarak işaretle. */
export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const code = (body.code as string)?.trim()?.toUpperCase();
  if (!code) return NextResponse.json({ error: "Kod gerekli" }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: order, error: findError } = await supabase
    .from("orders")
    .select("id, order_number, status, delivery_method")
    .eq("pickup_code", code)
    .single();

  if (findError || !order) {
    return NextResponse.json({ error: "Bu kodla sipariş bulunamadı." }, { status: 404 });
  }
  if (order.delivery_method !== "store_pickup") {
    return NextResponse.json({ error: "Bu sipariş mağazadan teslim değil." }, { status: 400 });
  }
  if (order.status === "DELIVERED") {
    return NextResponse.json({ success: true, message: "Sipariş zaten teslim alındı olarak işaretli.", orderNumber: order.order_number });
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: "DELIVERED", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    message: "Sipariş teslim alındı olarak işaretlendi.",
    orderNumber: order.order_number,
  });
}
