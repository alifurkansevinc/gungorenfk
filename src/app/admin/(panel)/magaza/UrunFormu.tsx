"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createProduct, updateProduct } from "@/app/actions/store";
import { useRouter } from "next/navigation";
import { AdminImageUploadList } from "@/components/admin/AdminImageUploadList";
import {
  STORE_SIZE_GROUPS,
  type StoreSizeGroupId,
  getSizeGroup,
  getSizeLabel,
  getSizesForGroup,
  inferSizeGroupFromSizes,
} from "@/lib/store-sizes";

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
  size_group?: string | null;
} | null;

function initialGroup(product?: Product): StoreSizeGroupId {
  if (product?.size_group && getSizeGroup(product.size_group)) {
    return product.size_group as StoreSizeGroupId;
  }
  if (product?.sizes?.length) {
    return inferSizeGroupFromSizes(product.sizes);
  }
  return "harf";
}

function initialSelectedSizes(product: Product | undefined, groupId: StoreSizeGroupId): Set<string> {
  const groupValues = new Set(getSizesForGroup(groupId).map((s) => s.value));
  if (product?.sizes?.length) {
    const fromProduct = product.sizes.filter((s) => groupValues.has(s));
    if (fromProduct.length > 0) return new Set(fromProduct);
  }
  return new Set(getSizesForGroup(groupId).map((s) => s.value));
}

function initialStock(product: Product | undefined, groupId: StoreSizeGroupId): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const { value } of getSizesForGroup(groupId)) {
    stock[value] = product?.stock_by_size?.[value] ?? 0;
  }
  return stock;
}

export function UrunFormu({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>(
    product?.images?.length ? product.images : product?.image_url ? [product.image_url] : [""]
  );
  const [sizeGroup, setSizeGroup] = useState<StoreSizeGroupId>(() => initialGroup(product));
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(() =>
    initialSelectedSizes(product, initialGroup(product))
  );
  const [stockBySize, setStockBySize] = useState<Record<string, number>>(() =>
    initialStock(product, initialGroup(product))
  );

  const groupSizes = useMemo(() => getSizesForGroup(sizeGroup), [sizeGroup]);
  const activeGroup = getSizeGroup(sizeGroup);

  function changeSizeGroup(nextGroup: StoreSizeGroupId) {
    setSizeGroup(nextGroup);
    const nextSizes = getSizesForGroup(nextGroup);
    setSelectedSizes(new Set(nextSizes.map((s) => s.value)));
    setStockBySize((prev) => {
      const next: Record<string, number> = {};
      for (const { value } of nextSizes) {
        next[value] = prev[value] ?? 0;
      }
      return next;
    });
  }

  function toggleSize(value: string, checked: boolean) {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (checked) next.add(value);
      else next.delete(value);
      return next;
    });
  }

  function selectAllInGroup() {
    setSelectedSizes(new Set(groupSizes.map((s) => s.value)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (selectedSizes.size === 0) {
      setError("En az bir beden seçmelisiniz.");
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("size_group", sizeGroup);
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

      <div className="rounded-2xl border border-bordo/15 bg-bordo/[0.03] p-4 sm:p-5 space-y-4">
        <div>
          <label className={labelClass}>Beden takımı *</label>
          <p className="mt-1 text-xs text-gray-500">
            Önce ürünün hangi beden sistemini kullandığını seçin. Sonra yalnızca o gruptaki bedenler açılır.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {STORE_SIZE_GROUPS.map((group) => {
              const isActive = sizeGroup === group.id;
              return (
                <label
                  key={group.id}
                  className={`flex cursor-pointer flex-col rounded-xl border px-3 py-3 transition-colors ${
                    isActive
                      ? "border-bordo bg-white shadow-sm ring-1 ring-bordo/20"
                      : "border-gray-200 bg-white/70 hover:border-bordo/30"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="size_group"
                      value={group.id}
                      checked={isActive}
                      onChange={() => changeSizeGroup(group.id)}
                      className="h-4 w-4 border-gray-300 text-bordo focus:ring-bordo"
                    />
                    <span className="text-sm font-semibold text-gray-900">{group.label}</span>
                  </span>
                  <span className="mt-1 pl-6 text-xs text-gray-500">{group.description}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className="border-t border-bordo/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className={labelClass}>
              {activeGroup?.label ?? "Bedenler"} — stok
            </label>
            {sizeGroup !== "tek" && (
              <button
                type="button"
                onClick={selectAllInGroup}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-bordo/40 hover:text-bordo"
              >
                Tümünü seç
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Satışa sunulacak bedenleri işaretleyin; her beden için stok girin.
          </p>

          {selectedSizes.size === 0 && (
            <p className="mt-3 text-sm font-medium text-red-600">En az bir beden seçmelisiniz.</p>
          )}

          <div className="mt-3 space-y-2">
            {groupSizes.map(({ value, label }) => {
              const isChecked = selectedSizes.has(value);
              const isTekGroup = sizeGroup === "tek";
              return (
                <div
                  key={value}
                  className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    isChecked ? "border-bordo/25 bg-white" : "border-gray-100 bg-gray-50/50"
                  }`}
                >
                  {!isTekGroup ? (
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        name="sizes"
                        value={value}
                        checked={isChecked}
                        onChange={(e) => toggleSize(value, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-bordo focus:ring-bordo"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ) : (
                    <>
                      <input type="hidden" name="sizes" value="tek_beden" />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </>
                  )}
                  {(isChecked || isTekGroup) && (
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Stok:</span>
                      <input
                        type="number"
                        name={`stock_${value}`}
                        min={0}
                        value={stockBySize[value] ?? 0}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          setStockBySize((prev) => ({
                            ...prev,
                            [value]: Number.isNaN(n) || n < 0 ? 0 : n,
                          }));
                        }}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-gray-900 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
                      />
                    </label>
                  )}
                </div>
              );
            })}
          </div>

          {selectedSizes.size > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Seçili bedenler: {[...selectedSizes].map(getSizeLabel).join(", ")}
            </p>
          )}
        </div>
      </div>

      <AdminImageUploadList
        folder="store"
        label="Ürün görselleri"
        urls={imageUrls}
        onChange={setImageUrls}
        inputClassName={inputClass}
      />
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
