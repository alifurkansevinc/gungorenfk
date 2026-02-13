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

  const inputClass =
    "mt-1 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo";
  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}
      <div>
        <label className={labelClass}>Ürün adı *</label>
        <input name="name" defaultValue={product?.name} required className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Slug (URL)</label>
        <input
          name="slug"
          defaultValue={product?.slug}
          placeholder="resmi-forma"
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Açıklama</label>
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
          rows={3}
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Fiyat (₺) *</label>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product?.price}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className={labelClass}>Görsel URL</label>
        <input
          name="image_url"
          type="url"
          defaultValue={product?.image_url ?? ""}
          placeholder="https://..."
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Supabase Storage veya harici görsel. İleride dosya yükleme eklenebilir.</p>
      </div>
      <div>
        <label className={labelClass}>Sıra</label>
        <input
          name="sort_order"
          type="number"
          defaultValue={product?.sort_order ?? 0}
          className={inputClass}
        />
      </div>
      {product && (
        <div className="flex items-center gap-2">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={product.is_active}
            className="h-4 w-4 rounded border-gray-300 text-bordo focus:ring-bordo"
          />
          <label className="text-sm text-gray-700">Aktif (sitede göster)</label>
        </div>
      )}
      <div className="flex gap-3 border-t border-gray-100 pt-6">
        <button
          type="submit"
          className="rounded-xl bg-bordo px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-bordo/90"
        >
          {product ? "Güncelle" : "Ekle"}
        </button>
        <Link
          href="/admin/magaza"
          className="rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
