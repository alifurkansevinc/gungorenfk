import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

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
      .select("id, order_number, notes, user_id, total")
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

      if (order.user_id) {
        const orderTotal = Number(order.total) || 0;
        const { data: profile } = await supabase
          .from("fan_profiles")
          .select("id, store_spend_total")
          .eq("user_id", order.user_id)
          .single();
        if (profile && orderTotal > 0) {
          const newTotal = (Number(profile.store_spend_total) || 0) + orderTotal;
          await supabase
            .from("fan_profiles")
            .update({ store_spend_total: newTotal, updated_at: new Date().toISOString() })
            .eq("id", profile.id);
          const levelResult = await checkAndLevelUp(order.user_id);
          if (levelResult.leveledUp && levelResult.newLevelId) {
            return NextResponse.redirect(
              new URL(`/odeme/basarili?orderNumber=${order.order_number}&levelUp=1&newLevel=${levelResult.newLevelId}`, base)
            );
          }
        }
      }

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
