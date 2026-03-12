"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { STORE_SIZE_OPTIONS, getSizeLabel } from "@/lib/store-sizes";

type Props = {
  productId: string;
  name: string;
  price: number;
  slug: string;
  sizes?: string[] | null;
  stockBySize?: Record<string, number> | null;
};

export function AddToCartButton({ productId, name, price, slug, sizes, stockBySize }: Props) {
  const { addItem, totalCount } = useCart();
  const sizeList = Array.isArray(sizes) && sizes.length > 0 ? sizes : ["tek_beden"];
  const stock = stockBySize ?? {};
  const hasStockData = Object.keys(stock).length > 0;
  const sizeWithStock = sizeList.map((s) => ({
    size: s,
    qty: hasStockData ? Math.max(0, Number(stock[s]) || 0) : 999,
  }));
  const inStockSizes = sizeWithStock.filter((x) => x.qty > 0).map((x) => x.size);
  const hasAnyStock = inStockSizes.length > 0;
  const defaultSelected = inStockSizes[0] ?? sizeList[0] ?? "tek_beden";
  const [selectedSize, setSelectedSize] = useState<string>(defaultSelected);
  const canAdd = hasAnyStock && (selectedSize ? (hasStockData ? (stock[selectedSize] ?? 0) > 0 : true) : false);

  const handleAdd = () => {
    if (!canAdd) return;
    addItem({ productId, name, price, quantity: 1, slug, size: selectedSize });
  };

  return (
    <div className="mt-8 rounded-2xl border-2 border-bordo/30 bg-bordo/5 p-6">
      <p className="font-semibold text-siyah">Sipariş</p>
      <p className="mt-2 text-sm text-siyah/70">
        Sepete ekleyip iyzico ile güvenli ödeme yapabilirsiniz.
      </p>

      <div className="mt-4">
        <span className="block text-sm font-medium text-siyah/80 mb-2">Beden (tek seçim)</span>
        <div className="flex flex-wrap gap-2">
          {sizeList.map((s) => {
            const qty = stock[s] ?? 0;
            const available = qty > 0;
            const isSelected = selectedSize === s;
            return (
              <button
                key={s}
                type="button"
                disabled={!available}
                onClick={() => available && setSelectedSize(s)}
                className={`
                  min-w-[3rem] rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition
                  ${available
                    ? isSelected
                      ? "border-bordo bg-bordo text-beyaz"
                      : "border-siyah/25 bg-beyaz text-siyah hover:border-bordo/50"
                    : "cursor-not-allowed border-siyah/15 bg-siyah/5 text-siyah/50"}
                `}
              >
                {available ? getSizeLabel(s) : "Kalmadı"}
              </button>
            );
          })}
        </div>
      </div>

      {!hasAnyStock && (
        <p className="mt-3 text-sm font-medium text-red-600">Bu üründe tüm bedenlerde stok kalmadı.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="inline-flex items-center justify-center rounded-xl bg-bordo px-6 py-3.5 text-sm font-bold text-beyaz shadow-md transition-all hover:bg-bordo-dark hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sepete ekle
        </button>
        <Link
          href="/sepet"
          className="inline-flex items-center justify-center rounded-xl border-2 border-siyah/20 px-6 py-3.5 text-sm font-bold text-siyah transition-colors hover:bg-siyah/5"
        >
          Sepet{totalCount > 0 ? ` (${totalCount})` : ""}
        </Link>
        <Link
          href="/magaza"
          className="inline-flex items-center justify-center rounded-xl border-2 border-siyah/20 px-6 py-3.5 text-sm font-bold text-siyah transition-colors hover:bg-siyah/5"
        >
          Mağazaya dön
        </Link>
      </div>
    </div>
  );
}
