import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { refundPaymentV2 } from "@/lib/iyzico";
import { restoreStockForOrder, reverseFanStoreSpendForOrder } from "@/lib/order-refund";

/**
 * Admin: Tam iade (iyzico Refund V2 + stok geri + mağaza harcaması düzeltmesi).
 * POST { orderId: string }
 *
 * Koşullar: payment_status = PAID, payment_method = iyzico, geçerli payment_id.
 * Not: Eski kayıtlarda payment_id yalnızca form token ise iyzico iade reddedebilir;
 *      bu durumda panelden iyzico özetinden paymentId kontrol edilmeli.
 */
export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { checkIsAdmin, hasValidBypass } = await import("@/app/admin/actions");
  const hasBypass = await hasValidBypass();
  const { isAdmin } = await checkIsAdmin(user.id);
  if (!isAdmin && !hasBypass) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  if (!orderId) return NextResponse.json({ error: "orderId gerekli" }, { status: 400 });

  const supabase = createServiceRoleClient();
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, order_number, payment_status, payment_method, payment_id, total, user_id, guest_email, notes, status")
    .eq("id", orderId)
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const row = order as {
    payment_status: string;
    payment_method: string | null;
    payment_id: string | null;
    total: number;
    order_number: string;
    user_id: string | null;
    guest_email: string | null;
    notes: string | null;
    status: string;
  };

  if (row.payment_status !== "PAID") {
    return NextResponse.json(
      { error: "Sadece ödenmiş (PAID) siparişler iade edilebilir." },
      { status: 400 }
    );
  }
  if ((row.payment_method ?? "").toLowerCase() !== "iyzico") {
    return NextResponse.json({ error: "Bu sipariş iyzico ile ödenmemiş; otomatik iade yok." }, { status: 400 });
  }
  if (!row.payment_id?.trim()) {
    return NextResponse.json({ error: "Ödeme referansı (payment_id) yok; iade başlatılamıyor." }, { status: 400 });
  }

  const total = Math.round(Number(row.total) * 100) / 100;
  if (total <= 0) {
    return NextResponse.json({ error: "Sipariş tutarı geçersiz." }, { status: 400 });
  }

  let refundRes: Awaited<ReturnType<typeof refundPaymentV2>>;
  try {
    refundRes = await refundPaymentV2({ paymentId: row.payment_id.trim(), price: total });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("refundPaymentV2 error:", e);
    return NextResponse.json({ error: `iyzico: ${msg}` }, { status: 502 });
  }

  if (refundRes.status !== "success") {
    const errMsg = refundRes.errorMessage || refundRes.errorCode || "İade reddedildi";
    return NextResponse.json({ error: errMsg, iyzico: refundRes }, { status: 400 });
  }

  const stockResult = await restoreStockForOrder(supabase, orderId);
  if (!stockResult.ok) {
    console.error("restoreStockForOrder after successful refund:", stockResult.error);
    return NextResponse.json(
      {
        error:
          "Para iadesi iyzico tarafında alındı ancak stok güncellenemedi. Destek: stokları manuel düzeltin.",
        partial: true,
        detail: stockResult.error,
      },
      { status: 500 }
    );
  }

  await reverseFanStoreSpendForOrder(supabase, {
    user_id: row.user_id,
    guest_email: row.guest_email,
    total,
  });

  const refundNote = `\n[İADE ${new Date().toISOString()}] iyzico refundHostReference: ${refundRes.refundHostReference ?? "—"} tutar: ${refundRes.price ?? total}`;
  const { error: upErr } = await supabase
    .from("orders")
    .update({
      payment_status: "REFUNDED",
      status: "CANCELLED",
      notes: `${row.notes || ""}${refundNote}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (upErr) {
    console.error("Order update after refund:", upErr);
    return NextResponse.json(
      {
        error: "İade alındı ve stok güncellendi ancak sipariş kaydı güncellenemedi. Manuel REFUNDED işaretleyin.",
        partial: true,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      orderNumber: row.order_number,
      refundedPrice: refundRes.price ?? String(total),
      refundHostReference: refundRes.refundHostReference,
    },
  });
}
