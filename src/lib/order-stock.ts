import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeSize(size: string | null | undefined): string {
  const value = size?.trim();
  return value || "tek_beden";
}

export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/** Beden stoğunu satır kilidiyle artırır veya düşürür. delta pozitifse stoğa ekler. */
export async function adjustProductSizeStock(
  supabase: SupabaseClient,
  productId: string,
  size: string,
  delta: number
): Promise<{ ok: true; stock: number } | { ok: false; error: string }> {
  if (!productId) return { ok: false, error: "Ürün bulunamadı." };
  if (!delta) return { ok: true, stock: 0 };
  const { data, error } = await supabase.rpc("adjust_product_size_stock", {
    p_product_id: productId,
    p_size: normalizeSize(size),
    p_delta: delta,
  });
  if (error) {
    const msg = error.message || "";
    if (msg.includes("Yetersiz stok")) return { ok: false, error: "Seçilen bedende yeterli stok yok." };
    if (msg.includes("Ürün bulunamadı")) return { ok: false, error: "Ürün stok kaydı bulunamadı." };
    return { ok: false, error: msg };
  }
  return { ok: true, stock: Number(data) || 0 };
}
