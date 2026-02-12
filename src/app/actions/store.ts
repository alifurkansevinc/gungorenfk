"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/app/admin/actions";

export async function createProduct(formData: FormData) {
  const supabase = await getAdminSupabase();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const description = (formData.get("description") as string) || null;
  const price = formData.get("price") as string;
  const image_url = (formData.get("image_url") as string) || null;
  const sort_order = parseInt((formData.get("sort_order") as string) || "0", 10);

  const { error } = await supabase.from("store_products").insert({
    name: name.trim(),
    slug: slug.trim(),
    description: description?.trim() || null,
    price: parseFloat(price) || 0,
    image_url: image_url?.trim() || null,
    sort_order,
    is_active: true,
  });
  if (error) return { error: error.message };
  revalidatePath("/magaza");
  revalidatePath("/admin/magaza");
  revalidatePath("/");
  return { ok: true };
}

export async function updateProduct(id: string, formData: FormData) {
  const supabase = await getAdminSupabase();
  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const description = (formData.get("description") as string) || null;
  const price = formData.get("price") as string;
  const image_url = (formData.get("image_url") as string) || null;
  const sort_order = parseInt((formData.get("sort_order") as string) || "0", 10);
  const is_active = formData.get("is_active") === "on";

  const { error } = await supabase
    .from("store_products")
    .update({
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      price: parseFloat(price) || 0,
      image_url: image_url?.trim() || null,
      sort_order,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };
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
