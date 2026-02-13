import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

/** Admin: Tüm siparişleri listele (tarih aralığı opsiyonel). */
export async function GET(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const limit = searchParams.get("limit");

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, user_id, guest_email, guest_name, guest_phone, shipping_address, subtotal, shipping_cost, total, status, payment_status, payment_method, delivery_method, pickup_date, pickup_code, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate + "T23:59:59.999Z");
  if (limit) query = query.limit(parseInt(limit, 10));

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderIds = (orders ?? []).map((o) => o.id);
  if (orderIds.length === 0) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, name, price, quantity")
    .in("order_id", orderIds);

  const itemsByOrder = new Map<string, typeof items>();
  for (const item of items ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  const result = (orders ?? []).map((o) => {
    const addr = (o.shipping_address as Record<string, unknown>) ?? {};
    const fullName = (addr.fullName as string) ?? o.guest_name ?? "";
    const email = (addr.email as string) ?? o.guest_email ?? "";
    const phone = (addr.phone as string) ?? o.guest_phone ?? "";
    const addressParts = [
      addr.address,
      addr.neighborhood,
      addr.district,
      addr.city,
      addr.zipCode,
    ].filter(Boolean);
    return {
      id: o.id,
      orderNumber: o.order_number,
      customer: {
        name: fullName,
        email,
        phone,
      },
      shippingAddress: addressParts.join(", ") || (o.delivery_method === "store_pickup" ? "Mağazadan teslim" : ""),
      items: itemsByOrder.get(o.id) ?? [],
      subtotal: Number(o.subtotal),
      shippingCost: Number(o.shipping_cost),
      total: Number(o.total),
      status: o.status,
      paymentStatus: o.payment_status,
      paymentMethod: o.payment_method,
      deliveryMethod: o.delivery_method ?? "shipping",
      pickupDate: o.pickup_date,
      pickupCode: o.pickup_code,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    };
  });

  return NextResponse.json({ success: true, data: result });
}

/** Admin: Sipariş durumu güncelle (status, vb.). */
export async function PUT(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  const updates: Record<string, unknown> = {};
  if (typeof status === "string" && validStatuses.includes(status)) {
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("orders").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
