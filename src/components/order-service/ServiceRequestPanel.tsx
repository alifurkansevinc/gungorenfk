"use client";

import { useEffect, useState, useTransition } from "react";
import { cancelOwnServiceRequest, submitServiceRequest } from "@/app/actions/order-service";
import {
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_TYPE_LABELS,
  type ServiceOrderView,
  type ServiceRequestType,
} from "@/lib/order-service-shared";
import { getSizeLabel } from "@/lib/store-sizes";

function money(amount: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(amount);
}

function statusClass(status: string) {
  if (status === "TAMAMLANDI") return "bg-green-100 text-green-800";
  if (status === "REDDEDILDI") return "bg-red-100 text-red-800";
  if (status === "IPTAL") return "bg-gray-100 text-gray-700";
  if (status === "TESLIM_ALINDI") return "bg-indigo-100 text-indigo-800";
  if (status === "ONAYLANDI") return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-900";
}

export function ServiceRequestPanel({
  orders,
  receiptToken,
  highlightOrderNumber,
}: {
  orders: ServiceOrderView[];
  receiptToken?: string;
  highlightOrderNumber?: string;
}) {
  useEffect(() => {
    if (!highlightOrderNumber) return;
    document.getElementById(`siparis-${highlightOrderNumber}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [highlightOrderNumber]);

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-siyah/20 bg-beyaz p-6 text-center text-sm text-siyah/60">
        Teslim edilmiş bir mağaza siparişi görünmüyor. Talep, sipariş teslim edildikten sonra 14 gün açıktır.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article
          key={order.id}
          id={`siparis-${order.orderNumber}`}
          className={`rounded-2xl border bg-beyaz p-4 shadow-sm sm:p-6 ${
            highlightOrderNumber === order.orderNumber ? "border-bordo" : "border-siyah/10"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-siyah">Sipariş {order.orderNumber}</h2>
              <p className="mt-1 text-sm text-siyah/60">
                {order.deliveryMethod === "store_pickup" ? "Mağazadan teslim" : "Kargo"} · {money(order.total)}
              </p>
            </div>
            {order.withinWindow && order.windowEndsAt ? (
              <p className="text-xs font-medium text-bordo">
                Son gün: {new Date(order.windowEndsAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
              </p>
            ) : (
              <p className="text-xs text-siyah/55">{order.windowHint}</p>
            )}
          </div>

          {order.requests.length > 0 && (
            <ul className="mt-4 space-y-2">
              {order.requests.map((request) => (
                <RequestRow key={request.id} request={request} receiptToken={receiptToken} />
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <ItemCard key={item.id} orderNumber={order.orderNumber} item={item} receiptToken={receiptToken} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function RequestRow({
  request,
  receiptToken,
}: {
  request: ServiceOrderView["requests"][number];
  receiptToken?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const sizeText =
    request.requestType === "SIZE_EXCHANGE"
      ? `${getSizeLabel(request.fromSize || "")} → ${getSizeLabel(request.toSize || "")}`
      : getSizeLabel(request.fromSize || "");

  return (
    <li className="rounded-xl border border-siyah/10 bg-siyah/[0.02] px-3 py-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(request.status)}`}>
          {SERVICE_REQUEST_STATUS_LABELS[request.status]}
        </span>
        <span className="font-medium text-siyah">
          {SERVICE_REQUEST_TYPE_LABELS[request.requestType]} · {request.itemName}
        </span>
        <span className="text-siyah/60">
          {request.quantity} adet · {sizeText}
        </span>
        {request.refundAmount != null && request.status === "TAMAMLANDI" && request.requestType === "RETURN" && (
          <span className="text-siyah/70">{money(request.refundAmount)}</span>
        )}
      </div>
      {request.adminNote && <p className="mt-1 text-xs text-siyah/55">Mağaza notu: {request.adminNote}</p>}
      {request.status === "TALEP" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await cancelOwnServiceRequest(request.id, receiptToken);
              if ("error" in result) setError(result.error);
            });
          }}
          className="mt-2 text-xs font-semibold text-bordo hover:underline disabled:opacity-60"
        >
          {pending ? "İptal ediliyor…" : "Talebi iptal et"}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </li>
  );
}

function ItemCard({
  orderNumber,
  item,
  receiptToken,
}: {
  orderNumber: string;
  item: ServiceOrderView["items"][number];
  receiptToken?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const initialType: ServiceRequestType = item.canReturn ? "RETURN" : "SIZE_EXCHANGE";
  const [requestType, setRequestType] = useState<ServiceRequestType>(initialType);
  const [quantity, setQuantity] = useState(Math.max(1, item.remainingQty));
  const [toSize, setToSize] = useState(item.exchangeSizes.find((size) => size.stock > 0)?.value ?? "");
  const [reason, setReason] = useState("");

  if (!item.canReturn && !item.canExchange) {
    return (
      <div className="rounded-xl border border-siyah/10 px-3 py-3 text-sm">
        <p className="font-medium text-siyah">{item.name}</p>
        <p className="mt-1 text-xs text-siyah/55">
          {item.sizeLabel} · {item.quantity} adet
          {item.namePrint ? ` · ${item.namePrint.fullName} ${item.namePrint.number}` : ""}
        </p>
        <p className="mt-1 text-xs text-siyah/60">{item.returnHint || item.exchangeHint}</p>
      </div>
    );
  }

  return (
    <form
      className="rounded-xl border border-siyah/10 px-3 py-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setDone(false);
        startTransition(async () => {
          const result = await submitServiceRequest({
            orderNumber,
            orderItemId: item.id,
            requestType,
            quantity: requestType === "SIZE_EXCHANGE" ? item.quantity : quantity,
            toSize: requestType === "SIZE_EXCHANGE" ? toSize : null,
            reason,
            receiptToken,
          });
          if ("error" in result) {
            setError(result.error);
            return;
          }
          setDone(true);
          setReason("");
        });
      }}
    >
      <p className="font-medium text-siyah">{item.name}</p>
      <p className="mt-1 text-xs text-siyah/55">
        {item.sizeLabel} · {money(item.price)} · kalan {item.remainingQty} / {item.quantity} adet
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.canReturn && (
          <button
            type="button"
            onClick={() => setRequestType("RETURN")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${requestType === "RETURN" ? "bg-bordo text-beyaz" : "bg-siyah/5 text-siyah"}`}
          >
            İade
          </button>
        )}
        {item.canExchange && (
          <button
            type="button"
            onClick={() => setRequestType("SIZE_EXCHANGE")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${requestType === "SIZE_EXCHANGE" ? "bg-bordo text-beyaz" : "bg-siyah/5 text-siyah"}`}
          >
            Beden değişimi
          </button>
        )}
      </div>

      {requestType === "RETURN" && item.canReturn && (
        <label className="mt-3 block text-xs font-medium text-siyah/70">
          Adet
          <select
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-siyah/15 px-3 py-2 text-sm"
          >
            {Array.from({ length: item.remainingQty }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}

      {requestType === "SIZE_EXCHANGE" && item.canExchange && (
        <label className="mt-3 block text-xs font-medium text-siyah/70">
          Yeni beden · satırın tamamı ({item.quantity} adet)
          <select
            value={toSize}
            onChange={(event) => setToSize(event.target.value)}
            className="mt-1 w-full rounded-lg border border-siyah/15 px-3 py-2 text-sm"
          >
            {item.exchangeSizes.map((size) => (
              <option key={size.value} value={size.value} disabled={size.stock < item.quantity}>
                {size.label}
                {size.stock < item.quantity ? " (stok yok)" : ` (${size.stock} adet)`}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="mt-3 block text-xs font-medium text-siyah/70">
        {requestType === "RETURN" ? "Gerekçe" : "Not (isteğe bağlı)"}
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          maxLength={500}
          required={requestType === "RETURN"}
          className="mt-1 w-full rounded-lg border border-siyah/15 px-3 py-2 text-sm"
        />
      </label>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {done && <p className="mt-2 text-xs font-medium text-green-700">Talebiniz alındı. Mağaza onayından sonra ürünü teslim edin.</p>}
      <button
        type="submit"
        disabled={pending || (requestType === "SIZE_EXCHANGE" && !toSize)}
        className="mt-3 rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90 disabled:opacity-60"
      >
        {pending ? "Gönderiliyor…" : "Talep gönder"}
      </button>
    </form>
  );
}
