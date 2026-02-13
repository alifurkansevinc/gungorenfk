"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/app/admin/actions";

function collectImageUrls(formData: FormData): string[] {
  const urls: string[] = [];
  let i = 0;
  while (true) {
    const v = formData.get(`image_url_${i}`) as string | null;
    if (!v?.trim()) break;
    urls.push(v.trim());
    i++;
  }
  return urls;
}

export async function createProduct(formData: FormData) {
  const supabase = await getAdminSupabase();
  const name = formData.get("name") as string;
  const sku = (formData.get("sku") as string)?.trim();
  if (!sku) return { error: "Ürün stok kodu (SKU) zorunludur." };
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const description = (formData.get("description") as string) || null;
  const price = formData.get("price") as string;
  const sort_order = parseInt((formData.get("sort_order") as string) || "0", 10);
  const imageUrls = collectImageUrls(formData);
  const image_url = imageUrls[0] || null;

  const { data: product, error } = await supabase
    .from("store_products")
    .insert({
      name: name.trim(),
      sku: sku.toUpperCase(),
      slug: slug.trim(),
      description: description?.trim() || null,
      price: parseFloat(price) || 0,
      image_url,
      sort_order,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  if (product && imageUrls.length > 0) {
    await supabase.from("store_product_images").insert(
      imageUrls.map((url, i) => ({ product_id: product.id, image_url: url, sort_order: i }))
    );
  }
  revalidatePath("/magaza");
  revalidatePath("/admin/magaza");
  revalidatePath("/");
  return { ok: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await getAdminSupabase();
  const name = formData.get("name") as string;
  const sku = (formData.get("sku") as string)?.trim();
  if (!sku) return { error: "Ürün stok kodu (SKU) zorunludur." };
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const description = (formData.get("description") as string) || null;
  const price = formData.get("price") as string;
  const sort_order = parseInt((formData.get("sort_order") as string) || "0", 10);
  const is_active = formData.get("is_active") === "on";
  const imageUrls = collectImageUrls(formData);
  const image_url = imageUrls[0] || null;

  const { error } = await supabase
    .from("store_products")
    .update({
      name: name.trim(),
      sku: sku.toUpperCase(),
      slug: slug.trim(),
      description: description?.trim() || null,
      price: parseFloat(price) || 0,
      image_url,
      sort_order,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await supabase.from("store_product_images").delete().eq("product_id", id);
  if (imageUrls.length > 0) {
    await supabase.from("store_product_images").insert(
      imageUrls.map((url, i) => ({ product_id: id, image_url: url, sort_order: i }))
    );
  }
  revalidatePath("/magaza");
  revalidatePath("/magaza/[slug]");
  revalidatePath("/admin/magaza");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProduct(id: string) {
  const supabase = await getAdminSupabase();
  const { error } = await supabase.from("store_products").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/magaza");
  revalidatePath("/admin/magaza");
  revalidatePath("/");
  return { ok: true };
}
