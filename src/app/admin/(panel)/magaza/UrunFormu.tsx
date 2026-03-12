"use client";

import { useState } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/store";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { STORE_SIZE_OPTIONS } from "@/lib/store-sizes";

type Product = {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  description: string | null;
  price: string | number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  images?: string[];
  sizes?: string[];
  stock_by_size?: Record<string, number> | null;
} | null;

export function UrunFormu({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.length ? product.images : product?.image_url ? [product.image_url] : [""]
  );

  function addImage() {
    setImageUrls((prev) => [...prev, ""]);
  }
  function removeImage(i: number) {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    imageUrls.filter(Boolean).forEach((url, i) => formData.set(`image_url_${i}`, url));

    const res = product
      ? await updateProduct(product.id, formData)
      : await createProduct(formData);

    if (res.error) {
      setError(res.error);
      return;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message: product ? "Ürün güncellendi." : "Ürün kaydedildi." } }));
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
        <label className={labelClass}>Ürün stok kodu (SKU) *</label>
        <input
          name="sku"
          defaultValue={product?.sku ?? product?.slug ?? ""}
          placeholder="RF-2024-001"
          required
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-500">Benzersiz stok kodu. Büyük harfe çevrilir.</p>
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
        <label className={labelClass}>Bedenler ve stok</label>
        <p className="mt-1 text-xs text-gray-500">Ürünün satışa sunulduğu bedenleri işaretleyin; her beden için stok adedi girin. Satışta stok otomatik düşer.</p>
        <div className="mt-3 space-y-3">
          {STORE_SIZE_OPTIONS.map(({ value, label }) => {
            const defaultChecked = product?.sizes?.includes(value) ?? (value === "tek_beden");
            const defaultStock = product?.stock_by_size?.[value] ?? 0;
            return (
              <div key={value} className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="sizes" value={value} defaultChecked={defaultChecked} className="h-4 w-4 rounded border-gray-300 text-bordo focus:ring-bordo" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Stok:</span>
                  <input
                    type="number"
                    name={`stock_${value}`}
                    min={0}
                    defaultValue={defaultStock}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-gray-900 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass}>Görseller (URL)</label>
          <button type="button" onClick={addImage} className="flex items-center gap-1 text-sm font-medium text-bordo hover:underline">
            <Plus className="h-4 w-4" /> Ekle
          </button>
        </div>
        <div className="mt-2 space-y-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setImageUrls((prev) => prev.map((u, j) => (j === i ? e.target.value : u)))}
                placeholder="https://..."
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                aria-label="Kaldır"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Birden fazla görsel ekleyebilirsiniz. Sıra önemli.</p>
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
