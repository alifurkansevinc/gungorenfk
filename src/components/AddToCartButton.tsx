"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

type Props = {
  productId: string;
  name: string;
  price: number;
  slug: string;
};

export function AddToCartButton({ productId, name, price, slug }: Props) {
  const { addItem, totalCount } = useCart();

  const handleAdd = () => {
    addItem({ productId, name, price, quantity: 1, slug });
  };

  return (
    <div className="mt-8 rounded-2xl border-2 border-bordo/30 bg-bordo/5 p-6">
      <p className="font-semibold text-siyah">Sipariş</p>
      <p className="mt-2 text-sm text-siyah/70">
        Sepete ekleyip iyzico ile güvenli ödeme yapabilirsiniz.
      </p>
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
