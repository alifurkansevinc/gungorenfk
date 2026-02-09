"use client";

import { useState } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/store";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
} | null;

export function UrunFormu({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const res = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/admin/magaza");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl space-y-4">
      {error && <p className="rounded bg-red-100 p-2 text-sm text-red-800">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-siyah">Ürün adı *</label>
        <input name="name" defaultValue={product?.name} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Slug (URL)</label>
        <input name="slug" defaultValue={product?.slug} placeholder="resmi-forma" className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Açıklama</label>
        <textarea name="description" defaultValue={product?.description ?? ""} rows={3} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Fiyat (₺) *</label>
        <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price} required className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Görsel URL</label>
        <input name="image_url" type="url" defaultValue={product?.image_url ?? ""} placeholder="https://..." className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
        <p className="mt-1 text-xs text-siyah/60">Supabase Storage veya harici görsel linki. İleride dosya yükleme eklenebilir.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-siyah">Sıra</label>
        <input name="sort_order" type="number" defaultValue={product?.sort_order ?? 0} className="mt-1 w-full rounded border border-siyah/20 px-3 py-2" />
      </div>
      {product && (
        <div className="flex items-center gap-2">
          <input name="is_active" type="checkbox" defaultChecked={product.is_active} className="rounded" />
          <label className="text-sm text-siyah">Aktif (sitede göster)</label>
        </div>
      )}
      <div className="flex gap-3 pt-4">
        <button type="submit" className="rounded bg-bordo px-4 py-2 font-semibold text-beyaz hover:bg-bordo-dark">
          {product ? "Güncelle" : "Ekle"}
        </button>
        <Link href="/admin/magaza" className="rounded border border-siyah/20 px-4 py-2 font-medium text-siyah hover:bg-siyah/5">
          İptal
        </Link>
      </div>
    </form>
  );
}
