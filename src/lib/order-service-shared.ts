export const SERVICE_WINDOW_DAYS = 14;

export const SERVICE_REQUEST_TYPES = ["RETURN", "SIZE_EXCHANGE"] as const;
export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];

export const SERVICE_REQUEST_STATUSES = [
  "TALEP",
  "ONAYLANDI",
  "TESLIM_ALINDI",
  "TAMAMLANDI",
  "REDDEDILDI",
  "IPTAL",
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const OPEN_SERVICE_STATUSES: ServiceRequestStatus[] = ["TALEP", "ONAYLANDI", "TESLIM_ALINDI"];

export const SERVICE_REQUEST_TYPE_LABELS: Record<ServiceRequestType, string> = {
  RETURN: "İade",
  SIZE_EXCHANGE: "Beden değişimi",
};

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  TALEP: "Talep alındı",
  ONAYLANDI: "Onaylandı",
  TESLIM_ALINDI: "Ürün teslim alındı",
  TAMAMLANDI: "Tamamlandı",
  REDDEDILDI: "Reddedildi",
  IPTAL: "İptal",
};

export type ExchangeSizeOption = { value: string; label: string; stock: number };

export type ServiceItemView = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  remainingQty: number;
  size: string | null;
  sizeLabel: string;
  namePrint: { fullName: string; number: string } | null;
  canReturn: boolean;
  canExchange: boolean;
  returnHint: string | null;
  exchangeHint: string | null;
  exchangeSizes: ExchangeSizeOption[];
};

export type ServiceRequestView = {
  id: string;
  orderItemId: string;
  itemName: string;
  requestType: ServiceRequestType;
  status: ServiceRequestStatus;
  quantity: number;
  fromSize: string | null;
  toSize: string | null;
  reason: string | null;
  adminNote: string | null;
  refundAmount: number | null;
  createdAt: string;
};

export type ServiceOrderView = {
  id: string;
  orderNumber: string;
  status: string;
  deliveryMethod: string;
  deliveredAt: string | null;
  windowEndsAt: string | null;
  withinWindow: boolean;
  windowHint: string | null;
  total: number;
  items: ServiceItemView[];
  requests: ServiceRequestView[];
};

export function serviceWindow(order: { status: string; delivered_at: string | null }): {
  within: boolean;
  endsAt: string | null;
  hint: string | null;
} {
  if (order.status !== "DELIVERED") {
    return { within: false, endsAt: null, hint: "Talep, sipariş teslim edildikten sonra açılır." };
  }
  const start = order.delivered_at ? new Date(order.delivered_at).getTime() : NaN;
  if (Number.isNaN(start)) {
    return { within: false, endsAt: null, hint: "Teslim tarihi bulunamadı. Mağaza ile iletişime geçin." };
  }
  const ends = new Date(start + SERVICE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const within = Date.now() <= ends.getTime();
  return {
    within,
    endsAt: ends.toISOString(),
    hint: within ? null : "Teslimden itibaren 14 gün doldu.",
  };
}
