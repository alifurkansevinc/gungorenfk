import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;

    if (!token) {
      return NextResponse.redirect(new URL("/bagis/hata?error=token_missing", req.url));
    }

    const result = await retrieveCheckoutForm(token);
    const supabase = createServiceRoleClient();

    const { data: donation, error: findError } = await supabase
      .from("donations")
      .select("id, user_id, amount")
      .eq("payment_token", token)
      .single();

    if (findError || !donation) {
      console.error("Donation not found for token:", token, findError);
      return NextResponse.redirect(new URL("/bagis/hata?error=kayit_bulunamadi", req.url));
    }

    const base = req.nextUrl.origin;

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      await supabase
        .from("donations")
        .update({
          payment_status: "PAID",
          payment_id: result.paymentId || token,
          updated_at: new Date().toISOString(),
        })
        .eq("id", donation.id);

      const amount = Number(donation.amount);

      if (donation.user_id) {
        const { data: profile } = await supabase
          .from("fan_profiles")
          .select("id, donation_total")
          .eq("user_id", donation.user_id)
          .single();
        if (profile) {
          const newTotal = (Number(profile.donation_total) || 0) + amount;
          await supabase
            .from("fan_profiles")
            .update({ donation_total: newTotal, updated_at: new Date().toISOString() })
            .eq("id", profile.id);
          const levelResult = await checkAndLevelUp(donation.user_id);
          if (levelResult.leveledUp && levelResult.newLevelId) {
            return NextResponse.redirect(
              new URL(`/bagis/basarili?levelUp=1&newLevel=${levelResult.newLevelId}`, base)
            );
          }
        }
      }

      return NextResponse.redirect(new URL("/bagis/basarili", base));
    }

    await supabase
      .from("donations")
      .update({ payment_status: "FAILED", updated_at: new Date().toISOString() })
      .eq("id", donation.id);
    return NextResponse.redirect(
      new URL(`/bagis/hata?error=${encodeURIComponent(result.errorMessage || "Ödeme başarısız")}`, base)
    );
  } catch (err) {
    console.error("Donation callback error:", err);
    const base = req.nextUrl.origin;
    return NextResponse.redirect(
      new URL(`/bagis/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, base)
    );
  }
}
