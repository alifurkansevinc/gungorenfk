import crypto from "crypto";

// iyzico Configuration
// PRODUCTION: https://api.iyzipay.com
// SANDBOX: https://sandbox-api.iyzipay.com

function getIyzicoEnv() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl = process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com";

  if (!apiKey || !secretKey) {
    throw new Error(
      "iyzico API credentials not configured. Set IYZICO_API_KEY and IYZICO_SECRET_KEY in .env"
    );
  }
  return { apiKey, secretKey, baseUrl };
}

function generateRandomString(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function generateAuthorizationHeaderV2(params: {
  apiKey: string;
  secretKey: string;
  uri: string;
  body: unknown;
  randomString: string;
}): string {
  const { apiKey, secretKey, uri, body, randomString } = params;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(randomString + uri + JSON.stringify(body ?? {}))
    .digest("hex");
  const authorizationParams = [
    `apiKey:${apiKey}`,
    `randomKey:${randomString}`,
    `signature:${signature}`,
  ].join("&");
  return `IYZWSv2 ${Buffer.from(authorizationParams).toString("base64")}`;
}

async function iyzicoPost<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const { apiKey, secretKey, baseUrl } = getIyzicoEnv();
  const randomString = generateRandomString();
  const url = new URL(path, baseUrl).toString();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-iyzi-rnd": randomString,
    "x-iyzi-client-version": "gungorenfk-nextjs",
    Authorization: generateAuthorizationHeaderV2({
      apiKey,
      secretKey,
      uri: path,
      body: body ?? {},
      randomString,
    }),
  };
  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body ?? {}) });
  const json = (await res.json().catch(() => ({}))) as T;
  return json;
}

const LOCALE_TR = "tr";
const CURRENCY_TRY = "TRY";
const PAYMENT_GROUP_PRODUCT = "PRODUCT";
const BASKET_ITEM_TYPE_PHYSICAL = "PHYSICAL";
const BASKET_ITEM_TYPE_VIRTUAL = "VIRTUAL";

export function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function formatPrice(price: number): string {
  return price.toFixed(2);
}

export interface CartItemForIyzico {
  id: string;
  name: string;
  category?: string;
  price: number;
  quantity: number;
}

function toBasketItems(items: CartItemForIyzico[]): Array<{ id: string; name: string; category1: string; category2?: string; itemType: string; price: string }> {
  return items.map((item) => ({
    id: item.id,
    name: item.name.substring(0, 100),
    category1: item.category || "Mağaza",
    category2: "Ürün",
    itemType: BASKET_ITEM_TYPE_PHYSICAL,
    price: formatPrice(item.price * item.quantity),
  }));
}

export interface PaymentRequest {
  orderId: string;
  orderNumber: string;
  price: number;
  paidPrice: number;
  shippingCost: number;
  buyer: {
    id: string;
    name: string;
    surname: string;
    email: string;
    identityNumber?: string;
    phone: string;
    registrationAddress: string;
    city: string;
    country: string;
    zipCode?: string;
  };
  shippingAddress: { contactName: string; city: string; district?: string; address: string; zipCode?: string };
  billingAddress: { contactName: string; city: string; district?: string; address: string; zipCode?: string };
  basketItems: CartItemForIyzico[];
  callbackUrl: string;
}

export async function initializeCheckoutForm(request: PaymentRequest): Promise<{
  status?: string;
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
}> {
  const iyzicoRequest: Record<string, unknown> = {
    locale: LOCALE_TR,
    conversationId: generateConversationId(),
    price: formatPrice(request.price),
    paidPrice: formatPrice(request.paidPrice),
    currency: CURRENCY_TRY,
    basketId: request.orderId,
    paymentGroup: PAYMENT_GROUP_PRODUCT,
    callbackUrl: request.callbackUrl,
    enabledInstallments: [1, 2, 3, 6, 9, 12],
    buyer: {
      id: request.buyer.id,
      name: request.buyer.name,
      surname: request.buyer.surname,
      email: request.buyer.email,
      identityNumber: request.buyer.identityNumber || "11111111111",
      registrationAddress: request.buyer.registrationAddress,
      ip: "85.34.78.112",
      city: request.buyer.city,
      country: request.buyer.country || "Turkey",
      zipCode: request.buyer.zipCode || "34000",
      gsmNumber: request.buyer.phone,
    },
    shippingAddress: {
      contactName: request.shippingAddress.contactName,
      city: request.shippingAddress.city,
      country: "Turkey",
      address: request.shippingAddress.address,
      zipCode: request.shippingAddress.zipCode || "34000",
    },
    billingAddress: {
      contactName: request.billingAddress.contactName,
      city: request.billingAddress.city,
      country: "Turkey",
      address: request.billingAddress.address,
      zipCode: request.billingAddress.zipCode || "34000",
    },
    basketItems: toBasketItems(request.basketItems),
  };
  if (request.shippingCost > 0) {
    (iyzicoRequest.basketItems as Array<Record<string, string>>).push({
      id: "SHIPPING",
      name: "Kargo Ücreti",
      category1: "Kargo",
      category2: "Teslimat",
      itemType: BASKET_ITEM_TYPE_VIRTUAL,
      price: formatPrice(request.shippingCost),
    });
  }
  return iyzicoPost("/payment/iyzipos/checkoutform/initialize/auth/ecom", iyzicoRequest) as Promise<{
    status?: string;
    token?: string;
    checkoutFormContent?: string;
    paymentPageUrl?: string;
    errorCode?: string;
    errorMessage?: string;
    errorGroup?: string;
  }>;
}

export async function retrieveCheckoutForm(token: string): Promise<{
  status?: string;
  paymentStatus?: string;
  paymentId?: string;
  errorMessage?: string;
}> {
  const body = { locale: LOCALE_TR, conversationId: generateConversationId(), token };
  return iyzicoPost("/payment/iyzipos/checkoutform/auth/ecom/detail", body) as Promise<{
    status?: string;
    paymentStatus?: string;
    paymentId?: string;
    errorMessage?: string;
  }>;
}
