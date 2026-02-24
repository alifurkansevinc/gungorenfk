import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { getGiftQuotaForLevel } from "@/lib/data";

/** Hediye hakkını kullan: seçilen mağaza ürünü için ücretsiz teslim kaydı oluşturur, QR döner. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ success: false, error: "Giriş yapmanız gerekir." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const productId = (body.productId as string)?.trim();
  if (!productId) return NextResponse.json({ success: false, error: "Ürün seçin." }, { status: 400 });

  const serviceSupabase = createServiceRoleClient();

  const { data: profile } = await serviceSupabase
    .from("fan_profiles")
    .select("fan_level_id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ success: false, error: "Profil bulunamadı." }, { status: 404 });

  const levelId = (profile as { fan_level_id?: number }).fan_level_id ?? 1;
  const quota = await getGiftQuotaForLevel(levelId);
  if (quota <= 0) return NextResponse.json({ success: false, error: "Bu rütbede hediye hakkınız yok." }, { status: 400 });

  const year = new Date().getFullYear();
  const { count } = await serviceSupabase
    .from("gift_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("redemption_year", year);
  const used = count ?? 0;
  if (used >= quota) return NextResponse.json({ success: false, error: "Bu yıl hediye hakkınız kalmadı." }, { status: 400 });

  const { data: product } = await serviceSupabase
    .from("store_products")
    .select("id, name")
    .eq("id", productId)
    .eq("is_active", true)
    .single();
  if (!product) return NextResponse.json({ success: false, error: "Ürün bulunamadı veya artık geçerli değil." }, { status: 404 });

  const qrCode = "GIFT-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
  const { data: redemption, error: insertErr } = await serviceSupabase
    .from("gift_redemptions")
    .insert({
      user_id: user.id,
      product_id: product.id,
      qr_code: qrCode,
      status: "pending_pickup",
      redemption_year: year,
    })
    .select("id, qr_code")
    .single();

  if (insertErr || !redemption) {
    return NextResponse.json({ success: false, error: insertErr?.message || "Kayıt oluşturulamadı." }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    qrCode: redemption.qr_code,
    productName: (product as { name: string }).name,
  });
}
