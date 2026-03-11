import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { checkAndLevelUp } from "@/lib/fan-level";

function getBaseUrl(req: NextRequest): string {
  return req.nextUrl.origin;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token?.trim()) {
    return NextResponse.redirect(new URL("/bagis/hata?error=token_missing", getBaseUrl(req)));
  }
  try {
    return await processDonationCallback(req, token.trim());
  } catch (err) {
    console.error("Donation callback GET error:", err);
    return NextResponse.redirect(
      new URL(`/bagis/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = (formData.get("token") as string | null)?.trim() ?? null;
    if (!token) {
      return NextResponse.redirect(new URL("/bagis/hata?error=token_missing", getBaseUrl(req)));
    }
    return await processDonationCallback(req, token);
  } catch (err) {
    console.error("Donation callback error:", err);
    return NextResponse.redirect(
      new URL(`/bagis/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}

async function processDonationCallback(req: NextRequest, token: string): Promise<NextResponse> {
  try {
    const result = await retrieveCheckoutForm(token);
    const supabase = createServiceRoleClient();

    const { data: donation, error: findError } = await supabase
      .from("donations")
      .select("id, user_id, amount")
      .eq("payment_token", token)
      .single();

    if (findError || !donation) {
      console.error("Donation not found for token:", token, findError);
      return NextResponse.redirect(new URL("/bagis/hata?error=kayit_bulunamadi", getBaseUrl(req)));
    }

    const base = getBaseUrl(req);

    if (result.status === "success" && result.paymentStatus === "SUCCESS") {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from("donations")
        .select("id", { count: "exact", head: true })
        .eq("payment_status", "PAID")
        .gte("created_at", `${year}-01-01`)
        .lt("created_at", `${year + 1}-01-01`);
      const seq = (count ?? 0) + 1;
      const receiptNumber = `BAGIS-${year}-${String(seq).padStart(5, "0")}`;

      await supabase
        .from("donations")
        .update({
          payment_status: "PAID",
          payment_id: result.paymentId || token,
          receipt_number: receiptNumber,
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
              new URL(`/bagis/basarili?id=${donation.id}&levelUp=1&newLevel=${levelResult.newLevelId}`, base)
            );
          }
        }
      }

      return NextResponse.redirect(new URL(`/bagis/basarili?id=${donation.id}`, base));
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
    return NextResponse.redirect(
      new URL(`/bagis/hata?error=${encodeURIComponent(err instanceof Error ? err.message : "Bir hata oluştu")}`, getBaseUrl(req))
    );
  }
}
