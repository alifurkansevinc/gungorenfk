"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

type ShippingSettings = {
  freeShippingThreshold: number;
  standardShippingCost: number;
  estimatedDeliveryDays: string;
};

const STEPS = [
  { id: 1, label: "Bilgiler" },
  { id: 2, label: "Adres" },
  { id: 3, label: "Kargo" },
  { id: 4, label: "Ödeme" },
];

const defaultShipping: ShippingSettings = {
  freeShippingThreshold: 500,
  standardShippingCost: 29.9,
  estimatedDeliveryDays: "2-3",
};

export default function OdemePage() {
  const router = useRouter();
  const { items, totalPrice } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null);
  const iyzicoFormRef = useRef<HTMLDivElement>(null);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShipping);

  const [deliveryMethod, setDeliveryMethod] = useState<"shipping" | "store_pickup">("shipping");

  const freeThreshold = shippingSettings.freeShippingThreshold;
  const standardCost = shippingSettings.standardShippingCost;
  const shippingCost = deliveryMethod === "store_pickup" ? 0 : (totalPrice >= freeThreshold ? 0 : standardCost);
  const total = totalPrice + shippingCost;

  const [customerInfo, setCustomerInfo] = useState({ fullName: "", email: "", phone: "" });
  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    city: "",
    district: "",
    address: "",
    zipCode: "34000",
  });

  useEffect(() => {
    if (items.length === 0 && !checkoutFormContent) router.replace("/sepet");
  }, [items.length, checkoutFormContent, router]);

  useEffect(() => {
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setShippingSettings(d.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/me/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.success && d.data) {
          setCustomerInfo((c) => ({
            ...c,
            fullName: d.data.fullName || c.fullName,
            email: d.data.email || c.email,
          }));
          if (d.data.city)
            setShippingAddress((s) => ({ ...s, city: d.data.city }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!checkoutFormContent || !iyzicoFormRef.current) return;
    iyzicoFormRef.current.innerHTML = checkoutFormContent;
    const scripts = iyzicoFormRef.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      if (oldScript.src) newScript.src = oldScript.src;
      else newScript.textContent = oldScript.textContent ?? "";
      oldScript.parentNode?.appendChild(newScript);
    });
  }, [checkoutFormContent]);

  const fullName = shippingAddress.fullName || customerInfo.fullName;
  const phone = shippingAddress.phone || customerInfo.phone;
  const email = customerInfo.email;

  const validateStep1 = () => customerInfo.fullName.trim() && customerInfo.email.trim() && customerInfo.phone.trim();
  const validateStep2 = () =>
    shippingAddress.city.trim() && shippingAddress.address.trim() && fullName && phone;

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1 && !validateStep1()) {
      setError("Ad, e-posta ve telefon gerekli.");
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      setError("İl ve adres gerekli.");
      return;
    }
    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const initiatePayment = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: customerInfo.email,
          deliveryMethod,
          items: items.map((i) => ({
            id: i.id,
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            category: "Mağaza",
          })),
          shippingAddress: {
            fullName,
            email,
            phone,
            city: shippingAddress.city,
            district: shippingAddress.district,
            address: shippingAddress.address,
            zipCode: shippingAddress.zipCode,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.checkoutFormContent) {
        setCheckoutFormContent(data.data.checkoutFormContent);
        setCurrentStep(4);
      } else {
        setError(data.error || "Ödeme başlatılamadı.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !checkoutFormContent) return null;

  const inputClass = "mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-siyah focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo";
  const labelClass = "block text-sm font-medium text-siyah";

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/sepet" className="text-sm font-medium text-bordo hover:text-bordo-dark">
              ← Sepete dön
            </Link>
            <span className="font-display text-lg font-bold text-siyah">Güngören FK</span>
            <span className="text-xs font-medium uppercase tracking-wider text-siyah/50">Güvenli ödeme</span>
          </div>
        </div>
      </div>

      {/* Adım göstergesi */}
      <div className="border-b border-siyah/5 bg-beyaz py-6">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 sm:gap-6">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    currentStep > step.id
                      ? "bg-bordo text-beyaz"
                      : currentStep === step.id
                        ? "bg-bordo text-beyaz"
                        : "bg-siyah/10 text-siyah/60"
                  }`}
                >
                  {currentStep > step.id ? "✓" : step.id}
                </div>
                <span className={`hidden font-medium sm:inline ${currentStep >= step.id ? "text-siyah" : "text-siyah/50"}`}>
                  {step.label}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={`h-0.5 w-6 sm:w-12 ${currentStep > step.id ? "bg-bordo" : "bg-siyah/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800" role="alert">
                {error}
              </div>
            )}

            {/* Adım 1: İletişim bilgileri */}
            {currentStep === 1 && (
              <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm sm:p-8">
                <h2 className="font-display text-xl font-bold text-siyah">İletişim bilgileri</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="fullName" className={labelClass}>Ad soyad</label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={customerInfo.fullName}
                      onChange={(e) => setCustomerInfo((c) => ({ ...c, fullName: e.target.value }))}
                      className={inputClass}
                      placeholder="Adınız soyadınız"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>E-posta</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo((c) => ({ ...c, email: e.target.value }))}
                      className={inputClass}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>Telefon</label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo((c) => ({ ...c, phone: e.target.value }))}
                      className={inputClass}
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full rounded-xl bg-bordo py-3.5 font-bold text-beyaz hover:bg-bordo-dark"
                  >
                    Adres bilgilerine geç
                  </button>
                </div>
              </div>
            )}

            {/* Adım 2: Teslimat adresi */}
            {currentStep === 2 && (
              <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm sm:p-8">
                <h2 className="font-display text-xl font-bold text-siyah">Teslimat adresi</h2>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className={labelClass}>Alıcı ad soyad</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setShippingAddress((s) => ({ ...s, fullName: e.target.value }));
                        if (!customerInfo.fullName) setCustomerInfo((c) => ({ ...c, fullName: e.target.value }));
                      }}
                      className={inputClass}
                      placeholder="Alıcının adı soyadı"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Telefon</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setShippingAddress((s) => ({ ...s, phone: e.target.value }));
                        if (!customerInfo.phone) setCustomerInfo((c) => ({ ...c, phone: e.target.value }));
                      }}
                      className={inputClass}
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>İl</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress((s) => ({ ...s, city: e.target.value }))}
                        className={inputClass}
                        placeholder="İstanbul"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>İlçe</label>
                      <input
                        type="text"
                        value={shippingAddress.district}
                        onChange={(e) => setShippingAddress((s) => ({ ...s, district: e.target.value }))}
                        className={inputClass}
                        placeholder="Kadıköy"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Adres</label>
                    <textarea
                      required
                      rows={2}
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress((s) => ({ ...s, address: e.target.value }))}
                      className={inputClass}
                      placeholder="Sokak, bina no, daire no"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Posta kodu</label>
                    <input
                      type="text"
                      value={shippingAddress.zipCode}
                      onChange={(e) => setShippingAddress((s) => ({ ...s, zipCode: e.target.value }))}
                      className={inputClass}
                      placeholder="34000"
                    />
                  </div>
                </div>
                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-xl border-2 border-siyah/20 px-6 py-3 font-semibold text-siyah hover:bg-siyah/5"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 rounded-xl bg-bordo py-3.5 font-bold text-beyaz hover:bg-bordo-dark"
                  >
                    Kargo seçimine geç
                  </button>
                </div>
              </div>
            )}

            {/* Adım 3: Kargo */}
            {currentStep === 3 && (
              <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm sm:p-8">
                <h2 className="font-display text-xl font-bold text-siyah">Teslimat seçeneği</h2>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("shipping")}
                    className={`w-full rounded-xl border-2 p-6 text-left transition-all ${
                      deliveryMethod === "shipping" ? "border-bordo bg-bordo/5" : "border-siyah/10 hover:border-siyah/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-siyah">Kargo ile teslim</p>
                        <p className="text-sm text-siyah/60">{shippingSettings.estimatedDeliveryDays} iş gününde kargoya verilir</p>
                      </div>
                      <p className="font-bold text-siyah">
                        {totalPrice >= freeThreshold ? (
                          <span className="text-green-700">Ücretsiz</span>
                        ) : (
                          `${standardCost.toFixed(2)} ₺`
                        )}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("store_pickup")}
                    className={`w-full rounded-xl border-2 p-6 text-left transition-all ${
                      deliveryMethod === "store_pickup" ? "border-bordo bg-bordo/5" : "border-siyah/10 hover:border-siyah/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-siyah">Güngören Store&apos;dan teslim al</p>
                        <p className="text-sm text-siyah/60">Siparişten 3 iş günü sonra mağazadan teslim, QR kod ile</p>
                      </div>
                      <p className="font-bold text-green-700">Ücretsiz</p>
                    </div>
                  </button>
                </div>
                {deliveryMethod === "shipping" && totalPrice < freeThreshold && (
                  <p className="mt-4 text-center text-sm text-siyah/60">
                    {(freeThreshold - totalPrice).toFixed(2)} ₺ daha ekleyin, ücretsiz kargo kazanın!
                  </p>
                )}
                <div className="mt-8 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="rounded-xl border-2 border-siyah/20 px-6 py-3 font-semibold text-siyah hover:bg-siyah/5"
                  >
                    Geri
                  </button>
                  <button
                    type="button"
                    onClick={initiatePayment}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-bordo py-3.5 font-bold text-beyaz hover:bg-bordo-dark disabled:opacity-50"
                  >
                    {loading ? "Ödeme formu hazırlanıyor..." : "Ödeme bilgilerine geç"}
                  </button>
                </div>
              </div>
            )}

            {/* Adım 4: iyzico ödeme */}
            {currentStep === 4 && (
              <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm sm:p-8">
                <h2 className="font-display text-xl font-bold text-siyah">Ödeme</h2>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-bordo border-t-transparent" />
                    <p className="mt-4 text-siyah/60">Ödeme formu yükleniyor...</p>
                  </div>
                ) : checkoutFormContent ? (
                  <div className="mt-6">
                    <div className="mb-6 rounded-xl bg-siyah/5 p-4">
                      <p className="font-semibold text-siyah">iyzico ile güvenli ödeme</p>
                      <p className="text-xs text-siyah/60">Kart bilgileriniz 256-bit SSL ile korunur.</p>
                    </div>
                    <div ref={iyzicoFormRef} id="iyzipay-checkout-form" className="min-h-[400px]" />
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="mt-6 rounded-xl border-2 border-siyah/20 px-6 py-3 font-semibold text-siyah hover:bg-siyah/5"
                    >
                      Geri
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-siyah/60">Ödeme formu yüklenemedi.</p>
                    <button
                      type="button"
                      onClick={initiatePayment}
                      disabled={loading}
                      className="mt-4 rounded-xl bg-bordo px-6 py-3 font-bold text-beyaz hover:bg-bordo-dark disabled:opacity-50"
                    >
                      Tekrar dene
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sipariş özeti */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h3 className="font-display text-lg font-bold text-siyah">Sipariş özeti</h3>
              <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-2 text-sm">
                    <span className="line-clamp-2 text-siyah">{item.name} × {item.quantity}</span>
                    <span className="shrink-0 font-semibold text-bordo">
                      {(item.price * item.quantity).toFixed(2)} ₺
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-siyah/10 pt-4 space-y-1 text-sm">
                <div className="flex justify-between text-siyah/70">
                  <span>Ara toplam</span>
                  <span>{totalPrice.toFixed(2)} ₺</span>
                </div>
                <div className="flex justify-between text-siyah/70">
                  <span>Kargo</span>
                  <span>{shippingCost === 0 ? "Ücretsiz" : `${shippingCost.toFixed(2)} ₺`}</span>
                </div>
                <div className="flex justify-between font-bold text-siyah text-base pt-2">
                  <span>Toplam</span>
                  <span className="text-bordo">{total.toFixed(2)} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
