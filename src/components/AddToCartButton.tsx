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
};

export function AddToCartButton({ productId, name, price, slug, sizes }: Props) {
  const { addItem, totalCount } = useCart();
  const availableSizes = Array.isArray(sizes) && sizes.length > 0 ? sizes : ["tek_beden"];
  const hasSizeChoice = availableSizes.length > 1;
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] ?? "tek_beden");

  const handleAdd = () => {
    addItem({ productId, name, price, quantity: 1, slug, size: selectedSize });
  };

  return (
    <div className="mt-8 rounded-2xl border-2 border-bordo/30 bg-bordo/5 p-6">
      <p className="font-semibold text-siyah">Sipariş</p>
      <p className="mt-2 text-sm text-siyah/70">
        Sepete ekleyip iyzico ile güvenli ödeme yapabilirsiniz.
      </p>
      {hasSizeChoice && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-siyah/80">Beden</label>
          <select
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            className="mt-1 rounded-xl border border-siyah/20 bg-beyaz px-4 py-2.5 text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
          >
            {availableSizes.map((s) => (
              <option key={s} value={s}>{getSizeLabel(s)}</option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center rounded-xl bg-bordo px-6 py-3.5 text-sm font-bold text-beyaz shadow-md transition-all hover:bg-bordo-dark hover:shadow-lg"
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
