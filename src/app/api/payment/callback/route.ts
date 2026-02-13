import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;

    if (!token) {
      return NextResponse.redirect(new URL("/odeme/hata?error=token_missing", req.url));
    }

    const result = await retrieveCheckoutForm(token);
    const supabase = createServiceRoleClient();

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, order_number, notes")
      .eq("payment_id", token)
      .single();

    if (findError || !order) {
      console.error("Order not found for token:", token, findError);
      return NextResponse.redirect(new URL("/odeme/hata?error=order_not_found", req.url));
    }

    const base = req.nextUrl.origin;

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      await supabase
        .from("orders")
        .update({
          status: "PROCESSING",
          payment_status: "PAID",
          payment_id: result.paymentId || token,
          notes: `${order.notes || ""}\niyzico paymentId: ${result.paymentId || token}`,
        })
        .eq("id", order.id);
      return NextResponse.redirect(new URL(`/odeme/basarili?orderNumber=${order.order_number}`, base));
    }

    const errorMessage = result.errorMessage || "Ödeme başarısız.";
    await supabase
      .from("orders")
      .update({
        status: "CANCELLED",
        payment_status: "FAILED",
        notes: `${order.notes || ""}\niyzico error: ${errorMessage}`,
      })
      .eq("id", order.id);
    return NextResponse.redirect(new URL(`/odeme/hata?error=${encodeURIComponent(errorMessage)}`, base));
  } catch (err) {
    console.error("Payment callback error:", err);
    const base = req.nextUrl.origin;
    return NextResponse.redirect(
      new URL(`/odeme/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, base)
    );
  }
}
