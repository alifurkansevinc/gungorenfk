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
  const status = searchParams.get("status");
  const paymentStatus = searchParams.get("paymentStatus");
  const deliveryMethod = searchParams.get("deliveryMethod");
  const withSummary = searchParams.get("summary") === "1";

  const supabase = createServiceRoleClient();

  let summary: {
    total: number;
    byPayment: Record<string, number>;
    totalCiro: number;
    kargoCount: number;
    storePickupCount: number;
  } | undefined;
  if (withSummary) {
    const { data: allRows } = await supabase
      .from("orders")
      .select("payment_status, delivery_method, status, total");
    const byPayment: Record<string, number> = { PENDING: 0, PAID: 0, FAILED: 0, REFUNDED: 0 };
    let totalCiro = 0;
    let kargoCount = 0;
    let storePickupCount = 0;
    for (const r of allRows ?? []) {
      const row = r as { payment_status: string; delivery_method: string; status: string; total: number };
      const ps = row.payment_status ?? "PENDING";
      byPayment[ps] = (byPayment[ps] ?? 0) + 1;
      if (ps === "PAID") {
        totalCiro += Number(row.total) || 0;
        const dm = row.delivery_method ?? "shipping";
        const st = row.status ?? "";
        if (dm === "shipping" && st !== "DELIVERED" && st !== "CANCELLED") kargoCount += 1;
        if (dm === "store_pickup" && st !== "DELIVERED") storePickupCount += 1;
      }
    }
    summary = {
      total: allRows?.length ?? 0,
      byPayment,
      totalCiro,
      kargoCount,
      storePickupCount,
    };
  }

  let query = supabase
    .from("orders")
    .select("id, order_number, user_id, guest_email, guest_name, guest_phone, shipping_address, subtotal, shipping_cost, total, status, payment_status, payment_method, delivery_method, pickup_date, pickup_code, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate + "T23:59:59.999Z");
  if (status) query = query.eq("status", status);
  if (paymentStatus) query = query.eq("payment_status", paymentStatus);
  if (deliveryMethod) query = query.eq("delivery_method", deliveryMethod);
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
    .select("id, order_id, product_id, name, price, quantity, size")
    .in("order_id", orderIds);

  const productIds = [...new Set((items ?? []).map((i) => (i as { product_id: string | null }).product_id).filter(Boolean))] as string[];
  const productImages: Record<string, string | null> = {};
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("store_products")
      .select("id, image_url")
      .in("id", productIds);
    for (const p of products ?? []) {
      const row = p as { id: string; image_url: string | null };
      productImages[row.id] = row.image_url ?? null;
    }
  }

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
      items: (itemsByOrder.get(o.id) ?? []).map((it) => ({
        ...it,
        image_url: (it as { product_id?: string }).product_id ? productImages[(it as { product_id: string }).product_id] ?? null : null,
      })),
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

  return NextResponse.json({ success: true, data: result, ...(summary ? { summary } : {}) });
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

/** Admin: Sipariş sil. Sadece ödeme durumu PAID olmayan siparişler silinebilir. */
export async function DELETE(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: adminRow } = await supabaseAuth.from("admin_users").select("id").eq("user_id", user.id).single();
  const hasBypass = await (await import("@/app/admin/actions")).hasValidBypass();
  if (!adminRow && !hasBypass) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: row, error: fetchErr } = await supabase.from("orders").select("payment_status").eq("id", id).single();
  if (fetchErr || !row) return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  if (row.payment_status === "PAID") return NextResponse.json({ error: "Ödendi statüsündeki sipariş silinemez." }, { status: 400 });

  const { error: delErr } = await supabase.from("orders").delete().eq("id", id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
