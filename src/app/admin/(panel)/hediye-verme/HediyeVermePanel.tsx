"use client";

import { useState, useEffect } from "react";
import {
  adminGiveGift,
  adminSetMemberProductDiscounts,
  adminGetMemberDiscounts,
} from "@/app/actions/admin";
import { Gift, Percent } from "lucide-react";

function showToast(message: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("admin-toast", { detail: { message } }));
  }
}

type Member = { userId: string; label: string };
type Product = { id: string; name: string; slug: string | null; price: number | string };

export function HediyeVermePanel({
  members,
  products,
}: {
  members: Member[];
  products: Product[];
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [giftProductId, setGiftProductId] = useState<string>("");
  const [giftQuantity, setGiftQuantity] = useState(1);
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [discounts, setDiscounts] = useState<Record<string, number>>({});
  const [discountSubmitting, setDiscountSubmitting] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);

  useEffect(() => {
    if (!selectedUserId) {
      setDiscounts({});
      return;
    }
    setLoadingDiscounts(true);
    adminGetMemberDiscounts(selectedUserId)
      .then(setDiscounts)
      .finally(() => setLoadingDiscounts(false));
  }, [selectedUserId]);

  const handleGiveGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !giftProductId) {
      showToast("Üye ve ürün seçin.");
      return;
    }
    setGiftSubmitting(true);
    try {
      const res = await adminGiveGift(selectedUserId, giftProductId, giftQuantity);
      if ("error" in res) {
        showToast(res.error);
        return;
      }
      showToast(`${giftQuantity} adet hediye verildi. QR kodlar üyenin Store cüzdanında görünecek.`);
      setGiftProductId("");
      setGiftQuantity(1);
    } finally {
      setGiftSubmitting(false);
    }
  };

  const handleSaveDiscounts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      showToast("Önce üye seçin.");
      return;
    }
    setDiscountSubmitting(true);
    try {
      const items = products.map((p) => ({
        productId: p.id,
        discountPercent: discounts[p.id] ?? 0,
      }));
      const res = await adminSetMemberProductDiscounts(selectedUserId, items);
      if ("error" in res) {
        showToast(res.error);
        return;
      }
      showToast("İndirimler kaydedildi.");
    } finally {
      setDiscountSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
        <label className="mb-2 block text-sm font-semibold text-siyah/80">Üye seçin</label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-siyah/20 bg-beyaz px-4 py-2 text-sm text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
        >
          <option value="">— Üye seçin —</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {!selectedUserId && (
        <p className="rounded-xl border border-siyah/10 bg-siyah/5 p-6 text-center text-siyah/60">
          Hediye veya indirim atamak için yukarıdan bir üye seçin.
        </p>
      )}

      {selectedUserId && (
        <>
          <div className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-siyah">
              <Gift className="h-5 w-5 text-bordo" />
              Storedan hediye ver
            </h2>
            <p className="mt-1 text-sm text-siyah/60">
              Ürün seçin ve adet girin. Üye Store cüzdanında QR kod ile teslim alır (beyaz rozet dahil).
            </p>
            <form onSubmit={handleGiveGift} className="mt-4 flex flex-wrap items-end gap-4">
              <div className="min-w-[200px]">
                <label className="mb-1 block text-xs font-medium text-siyah/70">Ürün</label>
                <select
                  value={giftProductId}
                  onChange={(e) => setGiftProductId(e.target.value)}
                  className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah"
                  required
                >
                  <option value="">— Ürün seçin —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {Number((p as { price: number }).price).toFixed(2)} ₺
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="mb-1 block text-xs font-medium text-siyah/70">Adet</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={giftQuantity}
                  onChange={(e) => setGiftQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg border border-siyah/20 bg-beyaz px-3 py-2 text-sm text-siyah"
                />
              </div>
              <button
                type="submit"
                disabled={giftSubmitting || !giftProductId}
                className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-50"
              >
                {giftSubmitting ? "Veriliyor…" : "Hediye ver"}
              </button>
            </form>
          </div>

          <div className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-bold text-siyah">
              <Percent className="h-5 w-5 text-bordo" />
              Ürüne indirim ata
            </h2>
            <p className="mt-1 text-sm text-siyah/60">
              Her ürün için bu üyeye özel indirim oranı (0–100). 0 = indirim yok. Kaydet butonu ile toplu güncellenir.
            </p>
            {loadingDiscounts ? (
              <p className="mt-4 text-sm text-siyah/60">Yükleniyor…</p>
            ) : (
              <form onSubmit={handleSaveDiscounts} className="mt-4">
                <div className="max-h-[400px] overflow-y-auto rounded-lg border border-siyah/10">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-siyah/5">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-siyah/70">Ürün</th>
                        <th className="w-24 px-4 py-2 text-right font-semibold text-siyah/70">İndirim %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-t border-siyah/5">
                          <td className="px-4 py-2 text-siyah/90">{p.name}</td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={1}
                              value={discounts[p.id] ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const v = raw === "" ? 0 : parseFloat(raw);
                                setDiscounts((prev) => ({
                                  ...prev,
                                  [p.id]: Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v)),
                                }));
                              }}
                              placeholder="0"
                              className="w-full rounded border border-siyah/20 px-2 py-1.5 text-right text-siyah"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  type="submit"
                  disabled={discountSubmitting}
                  className="mt-4 rounded-lg bg-siyah px-4 py-2 text-sm font-semibold text-beyaz hover:bg-siyah/90 disabled:opacity-50"
                >
                  {discountSubmitting ? "Kaydediliyor…" : "İndirimleri kaydet"}
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
