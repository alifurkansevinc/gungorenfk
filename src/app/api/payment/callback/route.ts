import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

function getBaseUrl(req: NextRequest): string {
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.redirect(new URL("/odeme/hata?error=token_missing", getBaseUrl(req)));
  }
  try {
    return await processPaymentCallback(req, token);
  } catch (err) {
    console.error("Payment callback GET error:", err);
    return NextResponse.redirect(
      new URL(`/odeme/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = (formData.get("token") as string | null)?.trim() ?? null;
    if (!token) {
      return NextResponse.redirect(new URL("/odeme/hata?error=token_missing", getBaseUrl(req)));
    }
    return await processPaymentCallback(req, token);
  } catch (err) {
    console.error("Payment callback error:", err);
    return NextResponse.redirect(
      new URL(`/odeme/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}

async function processPaymentCallback(req: NextRequest, token: string): Promise<NextResponse> {
  try {
    const result = await retrieveCheckoutForm(token);
    const supabase = createServiceRoleClient();

    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, order_number, notes, user_id, total, guest_email")
      .eq("payment_id", token)
      .single();

    if (findError || !order) {
      console.error("Order not found for token:", token, findError);
      return NextResponse.redirect(new URL("/odeme/hata?error=order_not_found", getBaseUrl(req)));
    }

    const base = getBaseUrl(req);

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

      // Sipariş kalemlerine göre stok düş
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, size, quantity")
        .eq("order_id", order.id);
      for (const item of orderItems ?? []) {
        const productId = (item as { product_id: string }).product_id;
        const size = ((item as { size: string | null }).size ?? "tek_beden").trim() || "tek_beden";
        const qty = Math.max(1, Number((item as { quantity: number }).quantity) || 1);
        const { data: prod } = await supabase.from("store_products").select("stock_by_size").eq("id", productId).single();
        if (!prod) continue;
        const stock = (prod.stock_by_size as Record<string, number> | null) ?? {};
        const current = Math.max(0, Number(stock[size]) || 0);
        const next = Math.max(0, current - qty);
        const nextStock = { ...stock, [size]: next };
        await supabase.from("store_products").update({ stock_by_size: nextStock, updated_at: new Date().toISOString() }).eq("id", productId);
      }

      const orderTotal = Number(order.total) || 0;
      let userIdToLevelUp: string | null = null;
      if (order.user_id && orderTotal > 0) {
        const { data: profile } = await supabase
          .from("fan_profiles")
          .select("id, store_spend_total")
          .eq("user_id", order.user_id)
          .single();
        if (profile) {
          const newTotal = (Number(profile.store_spend_total) || 0) + orderTotal;
          await supabase
            .from("fan_profiles")
            .update({ store_spend_total: newTotal, updated_at: new Date().toISOString() })
            .eq("id", profile.id);
          userIdToLevelUp = order.user_id;
        }
      } else if (!order.user_id && orderTotal > 0) {
        const guestEmail = (order as { guest_email?: string | null }).guest_email;
        if (guestEmail) {
          const { data: profileByEmail } = await supabase
            .from("fan_profiles")
            .select("id, user_id, store_spend_total")
            .eq("email", guestEmail)
            .maybeSingle();
          if (profileByEmail) {
            const newTotal = (Number(profileByEmail.store_spend_total) || 0) + orderTotal;
            await supabase
              .from("fan_profiles")
              .update({ store_spend_total: newTotal, updated_at: new Date().toISOString() })
              .eq("id", profileByEmail.id);
            userIdToLevelUp = profileByEmail.user_id as string;
          }
        }
      }
      if (userIdToLevelUp) {
        const levelResult = await checkAndLevelUp(userIdToLevelUp);
        if (levelResult.leveledUp && levelResult.newLevelId) {
          return NextResponse.redirect(
            new URL(`/odeme/basarili?orderNumber=${order.order_number}&levelUp=1&newLevel=${levelResult.newLevelId}`, base)
          );
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
    return NextResponse.redirect(
      new URL(`/odeme/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}
