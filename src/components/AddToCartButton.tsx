"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getSizeLabel } from "@/lib/store-sizes";
import {
  FORMA_NAME_PRINT_ADDON_TRY,
  cartLineIdForNamePrint,
  normalizeNamePrintPayload,
} from "@/lib/forma-name-print";

type Props = {
  productId: string;
  name: string;
  price: number;
  slug: string;
  sizes?: string[] | null;
  stockBySize?: Record<string, number> | null;
  isFormaProduct?: boolean;
};

export function AddToCartButton({
  productId,
  name,
  price,
  slug,
  sizes,
  stockBySize,
  isFormaProduct = false,
}: Props) {
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

  const [wantsNamePrint, setWantsNamePrint] = useState(false);
  const [draftFullName, setDraftFullName] = useState("");
  const [draftNumber, setDraftNumber] = useState("");
  const [printConfirmed, setPrintConfirmed] = useState(false);
  const [confirmedPrint, setConfirmedPrint] = useState<{ fullName: string; number: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const unitPrice = price + (wantsNamePrint ? FORMA_NAME_PRINT_ADDON_TRY : 0);

  const handleTogglePrint = (checked: boolean) => {
    setWantsNamePrint(checked);
    setPrintConfirmed(false);
    setConfirmedPrint(null);
    setFormError(null);
    if (!checked) {
      setDraftFullName("");
      setDraftNumber("");
    }
  };

  const handleConfirmPrint = () => {
    setFormError(null);
    const fn = draftFullName.trim();
    const num = draftNumber.trim();
    if (!fn || !num) {
      setFormError("İsim soyisim ve numara zorunludur.");
      return;
    }
    const normalized = normalizeNamePrintPayload(fn, num);
    setConfirmedPrint(normalized);
    setDraftFullName(normalized.fullName);
    setDraftNumber(normalized.number);
    setPrintConfirmed(true);
  };

  const handleAdd = () => {
    if (!canAdd) return;
    if (isFormaProduct && wantsNamePrint) {
      if (!printConfirmed || !confirmedPrint) {
        setFormError("İsim-numara yazdırma için alanları doldurup «Onayla»ya basın.");
        return;
      }
    }
    setFormError(null);
    const lineId =
      isFormaProduct && wantsNamePrint && confirmedPrint
        ? cartLineIdForNamePrint(productId, selectedSize, confirmedPrint)
        : undefined;

    addItem({
      id: lineId,
      productId,
      name,
      price: unitPrice,
      quantity: 1,
      slug,
      size: selectedSize,
      namePrintAddon: !!(isFormaProduct && wantsNamePrint && confirmedPrint),
      namePrintFullName: confirmedPrint?.fullName,
      namePrintNumber: confirmedPrint?.number,
    });
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
                onClick={() => {
                  available && setSelectedSize(s);
                  if (isFormaProduct && wantsNamePrint) {
                    setPrintConfirmed(false);
                    setConfirmedPrint(null);
                  }
                }}
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

      {isFormaProduct && (
        <div className="mt-6 rounded-xl border border-siyah/15 bg-beyaz/80 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={wantsNamePrint}
              onChange={(e) => handleTogglePrint(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-siyah/30 text-bordo focus:ring-bordo"
            />
            <span>
              <span className="font-semibold text-siyah">İsim-Numara Yazdırma</span>
              <span className="block text-sm text-siyah/70">
                Ek ücret: +{FORMA_NAME_PRINT_ADDON_TRY.toFixed(2)} ₺ (birim fiyata eklenir)
              </span>
            </span>
          </label>

          {wantsNamePrint && (
            <div className="mt-4 space-y-3 border-t border-siyah/10 pt-4">
              <p className="text-xs text-siyah/60">
                Kelimeler kayıt sırasında otomatik düzenlenir (baş harf büyük, devamı küçük).
              </p>
              <div>
                <label className="block text-sm font-medium text-siyah">İsim Soyisim</label>
                <input
                  type="text"
                  value={draftFullName}
                  onChange={(e) => {
                    setDraftFullName(e.target.value);
                    setPrintConfirmed(false);
                    setConfirmedPrint(null);
                  }}
                  className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
                  placeholder="Örn. Ahmet Yılmaz"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-siyah">Numara</label>
                <input
                  type="text"
                  value={draftNumber}
                  onChange={(e) => {
                    setDraftNumber(e.target.value);
                    setPrintConfirmed(false);
                    setConfirmedPrint(null);
                  }}
                  className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
                  placeholder="Örn. 10"
                  inputMode="numeric"
                />
              </div>
              <button
                type="button"
                onClick={handleConfirmPrint}
                className="w-full rounded-lg border-2 border-bordo bg-bordo/10 py-2.5 text-sm font-bold text-bordo hover:bg-bordo/20"
              >
                Onayla
              </button>
              {printConfirmed && confirmedPrint && (
                <p className="text-sm font-medium text-green-700">
                  ✓ {confirmedPrint.fullName} — #{confirmedPrint.number}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!hasAnyStock && (
        <p className="mt-3 text-sm font-medium text-red-600">Bu üründe tüm bedenlerde stok kalmadı.</p>
      )}

      {formError && <p className="mt-3 text-sm font-medium text-red-600">{formError}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-siyah/80">
        <span>Birim:</span>
        <span className="font-bold text-bordo">{unitPrice.toFixed(2)} ₺</span>
        {isFormaProduct && wantsNamePrint && (
          <span className="text-siyah/50">(ürün {price.toFixed(2)} ₺ + yazdırma {FORMA_NAME_PRINT_ADDON_TRY.toFixed(2)} ₺)</span>
        )}
      </div>

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
