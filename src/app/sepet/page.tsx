"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

const defaultShipping = { freeThreshold: 500, cost: 29.9 };

export default function SepetPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalCount } = useCart();
  const [shipping, setShipping] = useState(defaultShipping);
  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setShipping({
            freeThreshold: d.data.freeShippingThreshold ?? defaultShipping.freeThreshold,
            cost: d.data.standardShippingCost ?? defaultShipping.cost,
          });
        }
      })
      .catch(() => {});
  }, []);
  const shippingCost = totalPrice >= shipping.freeThreshold ? 0 : shipping.cost;
  const total = totalPrice + shippingCost;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-2xl font-bold text-siyah">Sepet</h1>
        <p className="mt-4 text-siyah/70">Sepetiniz boş.</p>
        <Link href="/magaza" className="mt-6 inline-block rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz hover:bg-bordo-dark">
          Mağazaya git
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-siyah sm:text-3xl">Sepet</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-siyah/10">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-4 first:pt-0">
                <div className="flex-1">
                  <p className="font-semibold text-siyah">{item.name}</p>
                  <p className="text-sm text-siyah/70">{Number(item.price).toFixed(2)} ₺ × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="h-8 w-8 rounded border border-siyah/20 text-siyah hover:bg-siyah/5"
                    aria-label="Azalt"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="h-8 w-8 rounded border border-siyah/20 text-siyah hover:bg-siyah/5"
                    aria-label="Artır"
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right font-bold text-bordo">
                  {(item.price * item.quantity).toFixed(2)} ₺
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-sm text-siyah/60 hover:text-red-600"
                  aria-label="Kaldır"
                >
                  Kaldır
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6">
          <p className="text-sm text-siyah/70">Ara toplam ({totalCount} ürün)</p>
          <p className="mt-1 text-xl font-bold text-siyah">{totalPrice.toFixed(2)} ₺</p>
          <p className="mt-2 text-sm text-siyah/70">Kargo {totalPrice >= shipping.freeThreshold ? "ücretsiz" : `${shipping.cost.toFixed(2)} ₺`}</p>
          <p className="mt-2 text-lg font-bold text-bordo">Toplam {total.toFixed(2)} ₺</p>
          <Link
            href="/odeme"
            className="mt-6 block w-full rounded-xl bg-bordo py-3.5 text-center font-bold text-beyaz hover:bg-bordo-dark"
          >
            Ödemeye geç
          </Link>
          <Link href="/magaza" className="mt-3 block text-center text-sm text-siyah/70 hover:text-bordo">
            Alışverişe devam et
          </Link>
        </div>
      </div>
    </div>
  );
}
