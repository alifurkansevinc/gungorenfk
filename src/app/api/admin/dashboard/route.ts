import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Admin: Dashboard özet (sipariş/satış sayıları, taraftar, ürün, son siparişler). */
export async function GET() {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createServiceRoleClient();

  const [
    { count: fansCount },
    { count: productsCount },
    { data: ordersData },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from("fan_profiles").select("id", { count: "exact", head: true }),
    supabase.from("store_products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, total, payment_status").eq("payment_status", "PAID"),
    supabase.from("orders").select("id, order_number, guest_name, guest_email, shipping_address, total, status, payment_status, created_at, delivery_method").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalOrders = ordersData?.length ?? 0;
  const totalSales = (ordersData ?? []).reduce((sum, o) => sum + Number(o.total), 0);

  const recent = (recentOrders ?? []).map((o) => {
    const addr = (o.shipping_address as Record<string, unknown>) ?? {};
    return {
      id: o.id,
      orderNumber: o.order_number,
      customerName: (addr.fullName as string) ?? o.guest_name ?? "Misafir",
      customerEmail: (addr.email as string) ?? o.guest_email ?? "-",
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.payment_status,
      deliveryMethod: o.delivery_method ?? "shipping",
      createdAt: o.created_at,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      totalOrders,
      totalSales,
      fansCount: fansCount ?? 0,
      productsCount: productsCount ?? 0,
      recentOrders: recent,
    },
  });
}
