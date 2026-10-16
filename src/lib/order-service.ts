import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { refundPaymentV2 } from "@/lib/iyzico";
import { reverseFanStoreSpendForOrder } from "@/lib/order-refund";
import { adjustProductSizeStock, normalizeSize, roundMoney } from "@/lib/order-stock";
import { completedRefundTotal } from "@/lib/store-spend";
import { cancelInvoiceForRefundedOrder } from "@/lib/uyum-invoice";
import { getSizeLabel, getSizeValuesForGroup, inferSizeGroupFromSizes } from "@/lib/store-sizes";
import {
  OPEN_SERVICE_STATUSES,
  SERVICE_REQUEST_TYPES,
  serviceWindow,
  type ServiceItemView,
  type ServiceOrderView,
  type ServiceRequestStatus,
  type ServiceRequestType,
} from "@/lib/order-service-shared";

export {
  OPEN_SERVICE_STATUSES,
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_TYPE_LABELS,
  SERVICE_REQUEST_TYPES,
  SERVICE_WINDOW_DAYS,
  serviceWindow,
} from "@/lib/order-service-shared";
export type {
  ExchangeSizeOption,
  ServiceItemView,
  ServiceOrderView,
  ServiceRequestStatus,
  ServiceRequestType,
  ServiceRequestView,
} from "@/lib/order-service-shared";

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  guest_name: string | null;
  status: string;
  payment_status: string;
  payment_method: string | null;
  payment_id: string | null;
  delivery_method: string | null;
  delivered_at: string | null;
  total: number;
  shipping_cost: number;
  subtotal: number;
  notes: string | null;
  receipt_token: string | null;
  shipping_address: Record<string, unknown> | null;
  created_at: string;
};

type ItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
  options: { namePrint?: { fullName?: string; number?: string } } | null;
};

type RequestRow = {
  id: string;
  order_id: string;
  order_item_id: string;
  user_id: string | null;
  request_type: ServiceRequestType;
  status: ServiceRequestStatus;
  quantity: number;
  from_size: string | null;
  to_size: string | null;
  reason: string | null;
  admin_note: string | null;
  refund_amount: number | null;
  refund_host_reference: string | null;
  stock_reserved: boolean;
  old_stock_restored: boolean;
  spend_reversed: boolean;
  created_at: string;
  resolved_at: string | null;
};

type ProductRow = {
  id: string;
  sizes: string[] | null;
  size_group: string | null;
  stock_by_size: Record<string, number> | null;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function hasNamePrint(options: ItemRow["options"]): { fullName: string; number: string } | null {
  const print = options?.namePrint;
  const fullName = print?.fullName?.trim() || "";
  const number = print?.number?.trim() || "";
  if (!fullName && !number) return null;
  return { fullName, number };
}

function appendNote(existing: string | null, line: string): string {
  const base = (existing || "").trimEnd();
  return base ? `${base}\n${line}` : line;
}

async function claimFlag(
  supabase: SupabaseClient,
  id: string,
  column: "stock_reserved" | "old_stock_restored" | "spend_reversed",
  next: boolean
): Promise<boolean> {
  const { data, error } = await supabase
    .from("order_service_requests")
    .update({ [column]: next })
    .eq("id", id)
    .eq(column, !next)
    .select("id");
  if (error) return false;
  return (data ?? []).length > 0;
}

function buildViews(orders: OrderRow[], items: ItemRow[], requests: RequestRow[], products: ProductRow[]): ServiceOrderView[] {
  const productById = new Map(products.map((product) => [product.id, product]));
  const itemsByOrder = new Map<string, ItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }
  const requestsByOrder = new Map<string, RequestRow[]>();
  for (const request of requests) {
    const list = requestsByOrder.get(request.order_id) ?? [];
    list.push(request);
    requestsByOrder.set(request.order_id, list);
  }

  return orders.map((order) => {
    const window = serviceWindow(order);
    const orderItems = itemsByOrder.get(order.id) ?? [];
    const orderRequests = (requestsByOrder.get(order.id) ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const itemName = new Map(orderItems.map((item) => [item.id, item.name]));

    const viewItems: ServiceItemView[] = orderItems.map((item) => {
      const print = hasNamePrint(item.options);
      const itemRequests = orderRequests.filter((request) => request.order_item_id === item.id);
      const open = itemRequests.find((request) => OPEN_SERVICE_STATUSES.includes(request.status));
      const returnedQty = itemRequests
        .filter((request) => request.request_type === "RETURN" && request.status === "TAMAMLANDI")
        .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
      const remainingQty = Math.max(0, Number(item.quantity) - returnedQty);
      const product = item.product_id ? productById.get(item.product_id) : undefined;
      const sizeGroup = product?.size_group || inferSizeGroupFromSizes(product?.sizes);
      const allowed = new Set(product?.sizes?.length ? product.sizes : getSizeValuesForGroup(sizeGroup));
      const currentSize = normalizeSize(item.size);
      const stock = product?.stock_by_size ?? {};
      const exchangeSizes = [...allowed]
        .filter((value) => value !== currentSize)
        .map((value) => ({
          value,
          label: getSizeLabel(value),
          stock: Math.max(0, Number(stock[value]) || 0),
        }));

      let returnHint: string | null = null;
      let exchangeHint: string | null = null;
      if (window.hint) {
        returnHint = window.hint;
        exchangeHint = window.hint;
      } else if (print) {
        returnHint = "İsim-numara yazdırılan ürünlerde iade ve beden değişimi yok.";
        exchangeHint = returnHint;
      } else if (open) {
        returnHint = "Bu kalemde açık bir talep var.";
        exchangeHint = returnHint;
      } else if (remainingQty < 1) {
        returnHint = "Bu kalemin tamamı iade edilmiş.";
        exchangeHint = returnHint;
      } else if (returnedQty > 0 || remainingQty !== Number(item.quantity)) {
        exchangeHint = "Beden değişimi, iadesi başlamamış satırın tamamı için yapılır.";
      }

      if (!exchangeHint && (sizeGroup === "tek" || exchangeSizes.length === 0)) {
        exchangeHint = "Bu üründe beden değişimi yok.";
      } else if (!exchangeHint && !exchangeSizes.some((option) => option.stock > 0)) {
        exchangeHint = "Diğer bedenlerde stok yok.";
      }
      if (!exchangeHint && !product) exchangeHint = "Ürün kaydı bulunamadığı için beden değişimi açılamaz.";

      return {
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        remainingQty,
        size: item.size,
        sizeLabel: getSizeLabel(currentSize),
        namePrint: print,
        canReturn: !returnHint && remainingQty > 0,
        canExchange: !exchangeHint,
        returnHint,
        exchangeHint,
        exchangeSizes,
      };
    });

    return {
      id: order.id,
      orderNumber: order.order_number,
      status: order.status,
      deliveryMethod: order.delivery_method ?? "shipping",
      deliveredAt: order.delivered_at,
      windowEndsAt: window.endsAt,
      withinWindow: window.within,
      windowHint: window.hint,
      total: Number(order.total),
      items: viewItems,
      requests: orderRequests.map((request) => ({
        id: request.id,
        orderItemId: request.order_item_id,
        itemName: itemName.get(request.order_item_id) ?? "Ürün",
        requestType: request.request_type,
        status: request.status,
        quantity: Number(request.quantity),
        fromSize: request.from_size,
        toSize: request.to_size,
        reason: request.reason,
        adminNote: request.admin_note,
        refundAmount: request.refund_amount == null ? null : Number(request.refund_amount),
        createdAt: request.created_at,
      })),
    };
  });
}

const ORDER_COLUMNS =
  "id, order_number, user_id, guest_email, guest_name, status, payment_status, payment_method, payment_id, delivery_method, delivered_at, total, shipping_cost, subtotal, notes, receipt_token, shipping_address, created_at";

async function hydrateOrders(supabase: SupabaseClient, orders: OrderRow[]): Promise<ServiceOrderView[]> {
  if (!orders.length) return [];
  const orderIds = orders.map((order) => order.id);
  const { data: itemRows } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, name, price, quantity, size, options")
    .in("order_id", orderIds);
  const items = (itemRows ?? []) as ItemRow[];
  const { data: requestRows } = await supabase
    .from("order_service_requests")
    .select("id, order_id, order_item_id, user_id, request_type, status, quantity, from_size, to_size, reason, admin_note, refund_amount, refund_host_reference, stock_reserved, old_stock_restored, spend_reversed, created_at, resolved_at")
    .in("order_id", orderIds);
  const requests = (requestRows ?? []) as RequestRow[];
  const productIds = [...new Set(items.map((item) => item.product_id).filter(Boolean))] as string[];
  let products: ProductRow[] = [];
  if (productIds.length) {
    const { data } = await supabase.from("store_products").select("id, sizes, size_group, stock_by_size").in("id", productIds);
    products = (data ?? []) as ProductRow[];
  }
  return buildViews(orders, items, requests, products);
}

export async function listServiceOrdersForUser(userId: string, email: string | null | undefined): Promise<ServiceOrderView[]> {
  const supabase = createServiceRoleClient();
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data: byUser } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("user_id", userId)
    .eq("payment_status", "PAID")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(30);
  const guestEmail = email?.trim();
  const { data: byEmail } = guestEmail
    ? await supabase
        .from("orders")
        .select(ORDER_COLUMNS)
        .is("user_id", null)
        .eq("guest_email", guestEmail)
        .eq("payment_status", "PAID")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: [] as OrderRow[] };

  const merged = new Map<string, OrderRow>();
  for (const order of [...(byUser ?? []), ...(byEmail ?? [])] as OrderRow[]) merged.set(order.id, order);

  const { data: ownRequests } = await supabase
    .from("order_service_requests")
    .select("order_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);
  const missingIds = [...new Set((ownRequests ?? []).map((row) => (row as { order_id: string }).order_id))].filter(
    (id) => !merged.has(id)
  );
  if (missingIds.length) {
    const { data: extra } = await supabase.from("orders").select(ORDER_COLUMNS).in("id", missingIds).eq("payment_status", "PAID");
    for (const order of (extra ?? []) as OrderRow[]) merged.set(order.id, order);
  }

  const orders = [...merged.values()].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return hydrateOrders(supabase, orders);
}

export async function listServiceOrderByToken(
  orderNumber: string,
  receiptToken: string
): Promise<{ error: string } | { order: ServiceOrderView }> {
  const number = orderNumber.trim();
  const token = receiptToken.trim();
  if (!number || !token) return { error: "Sipariş numarası ve makbuz kodu gerekli." };
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("orders").select(ORDER_COLUMNS).eq("order_number", number).maybeSingle();
  const order = data as OrderRow | null;
  if (!order || !order.receipt_token || order.receipt_token !== token || order.payment_status !== "PAID") {
    return { error: "Sipariş bulunamadı veya makbuz kodu hatalı." };
  }
  const views = await hydrateOrders(supabase, [order]);
  const view = views[0];
  if (!view) return { error: "Sipariş bulunamadı veya makbuz kodu hatalı." };
  return { order: view };
}

type Access =
  | { error: string }
  | { supabase: SupabaseClient; order: OrderRow; actorUserId: string | null };

async function accessOrder(orderNumber: string, receiptToken?: string | null): Promise<Access> {
  const supabase = createServiceRoleClient();
  const number = orderNumber.trim();
  if (!number) return { error: "Sipariş numarası gerekli." };
  const { data } = await supabase.from("orders").select(ORDER_COLUMNS).eq("order_number", number).maybeSingle();
  const order = data as OrderRow | null;
  if (!order) return { error: "Sipariş bulunamadı." };

  const token = receiptToken?.trim();
  if (token && order.receipt_token && token === order.receipt_token) {
    return { supabase, order, actorUserId: null };
  }

  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return { error: "Bu sipariş için giriş yapın veya ödeme sayfasındaki bağlantıyı kullanın." };
  if (order.user_id === user.id) return { supabase, order, actorUserId: user.id };
  const email = user.email?.trim().toLowerCase();
  if (!order.user_id && email && order.guest_email?.trim().toLowerCase() === email) {
    return { supabase, order, actorUserId: user.id };
  }
  return { error: "Bu sipariş size ait değil." };
}

export async function createServiceRequest(input: {
  orderNumber: string;
  orderItemId: string;
  requestType: ServiceRequestType;
  quantity: number;
  toSize?: string | null;
  reason?: string | null;
  receiptToken?: string | null;
}): Promise<{ ok: true; id: string } | { error: string }> {
  if (!SERVICE_REQUEST_TYPES.includes(input.requestType)) return { error: "Talep türü geçersiz." };
  if (!UUID_RE.test(input.orderItemId)) return { error: "Ürün kalemi geçersiz." };
  const access = await accessOrder(input.orderNumber, input.receiptToken);
  if ("error" in access) return access;
  const { supabase, order, actorUserId } = access;
  if (order.payment_status !== "PAID") return { error: "Yalnızca ödenmiş siparişler için talep açılır." };

  const window = serviceWindow(order);
  if (!window.within) return { error: window.hint || "Talep süresi kapalı." };

  const { data: itemData } = await supabase
    .from("order_items")
    .select("id, order_id, product_id, name, price, quantity, size, options")
    .eq("id", input.orderItemId)
    .eq("order_id", order.id)
    .maybeSingle();
  const item = itemData as ItemRow | null;
  if (!item) return { error: "Sipariş kalemi bulunamadı." };
  if (hasNamePrint(item.options)) return { error: "İsim-numara yazdırılan ürünlerde iade ve beden değişimi yok." };

  const { data: existingRows } = await supabase
    .from("order_service_requests")
    .select("id, request_type, status, quantity")
    .eq("order_item_id", item.id);
  const existing = (existingRows ?? []) as Pick<RequestRow, "request_type" | "status" | "quantity">[];
  if (existing.some((request) => OPEN_SERVICE_STATUSES.includes(request.status))) {
    return { error: "Bu kalemde açık bir talep var." };
  }
  const returnedQty = existing
    .filter((request) => request.request_type === "RETURN" && request.status === "TAMAMLANDI")
    .reduce((sum, request) => sum + Number(request.quantity || 0), 0);
  const remainingQty = Math.max(0, Number(item.quantity) - returnedQty);
  const quantity = Math.floor(Number(input.quantity));
  if (!Number.isFinite(quantity) || quantity < 1) return { error: "Adet en az 1 olmalı." };
  if (quantity > remainingQty) return { error: "İade edilebilecek adetten fazla seçildi." };

  const reason = (input.reason || "").trim().slice(0, 500);
  const fromSize = normalizeSize(item.size);
  let toSize: string | null = null;

  if (input.requestType === "RETURN") {
    if (reason.length < 3) return { error: "İade gerekçesini kısaca yazın." };
  } else {
    if (returnedQty > 0 || quantity !== Number(item.quantity)) {
      return { error: "Beden değişimi, iadesi başlamamış satırın tamamı için yapılır." };
    }
    toSize = (input.toSize || "").trim();
    if (!toSize || toSize === fromSize) return { error: "Farklı bir beden seçin." };
    if (!item.product_id) return { error: "Ürün kaydı bulunamadığı için beden değişimi açılamaz." };
    const { data: productData } = await supabase
      .from("store_products")
      .select("id, sizes, size_group, stock_by_size")
      .eq("id", item.product_id)
      .maybeSingle();
    const product = productData as ProductRow | null;
    if (!product) return { error: "Ürün kaydı bulunamadı." };
    const sizeGroup = product.size_group || inferSizeGroupFromSizes(product.sizes);
    if (sizeGroup === "tek") return { error: "Bu üründe beden değişimi yok." };
    const allowed = new Set(product.sizes?.length ? product.sizes : getSizeValuesForGroup(sizeGroup));
    if (!allowed.has(toSize)) return { error: "Seçilen beden bu ürüne ait değil." };
    const stock = Math.max(0, Number(product.stock_by_size?.[toSize]) || 0);
    if (stock < quantity) return { error: "Seçilen bedende yeterli stok yok." };
  }

  const { data: inserted, error } = await supabase
    .from("order_service_requests")
    .insert({
      order_id: order.id,
      order_item_id: item.id,
      user_id: actorUserId,
      request_type: input.requestType,
      status: "TALEP",
      quantity,
      from_size: fromSize,
      to_size: toSize,
      reason: reason || null,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { error: "Bu kalemde açık bir talep var." };
    return { error: error.message };
  }
  return { ok: true, id: (inserted as { id: string }).id };
}

export async function cancelServiceRequest(
  requestId: string,
  receiptToken?: string | null
): Promise<{ ok: true } | { error: string }> {
  if (!UUID_RE.test(requestId)) return { error: "Talep bulunamadı." };
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("order_service_requests")
    .select("id, order_id, status, stock_reserved")
    .eq("id", requestId)
    .maybeSingle();
  const request = data as Pick<RequestRow, "id" | "order_id" | "status" | "stock_reserved"> | null;
  if (!request) return { error: "Talep bulunamadı." };
  if (request.status !== "TALEP") return { error: "Yalnızca henüz onaylanmamış talepler iptal edilir." };
  if (request.stock_reserved) return { error: "Rezerve edilmiş talep iptal edilemez. Mağaza ile iletişime geçin." };

  const { data: orderData } = await supabase.from("orders").select("order_number").eq("id", request.order_id).maybeSingle();
  const orderNumber = (orderData as { order_number: string } | null)?.order_number;
  if (!orderNumber) return { error: "Sipariş bulunamadı." };
  const access = await accessOrder(orderNumber, receiptToken);
  if ("error" in access) return access;
  if (access.order.id !== request.order_id) return { error: "Talep bulunamadı." };

  const { data: updated, error } = await supabase
    .from("order_service_requests")
    .update({ status: "IPTAL", resolved_at: new Date().toISOString() })
    .eq("id", requestId)
    .eq("status", "TALEP")
    .select("id");
  if (error) return { error: error.message };
  if (!(updated ?? []).length) return { error: "Talep artık iptal edilemez." };
  return { ok: true };
}

async function requireAdminClient(): Promise<{ error: string } | { supabase: SupabaseClient }> {
  const { checkIsAdmin, hasValidBypass } = await import("@/app/admin/actions");
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return { error: "Oturum gerekli." };
  const bypass = await hasValidBypass();
  const { isAdmin } = await checkIsAdmin(user.id);
  if (!isAdmin && !bypass) return { error: "Yetkiniz yok." };
  return { supabase: createServiceRoleClient() };
}

async function loadRequest(supabase: SupabaseClient, requestId: string): Promise<RequestRow | null> {
  const { data } = await supabase.from("order_service_requests").select("*").eq("id", requestId).maybeSingle();
  return (data as RequestRow | null) ?? null;
}

export async function transitionServiceRequest(input: {
  requestId: string;
  action: "approve" | "reject" | "receive" | "complete";
  adminNote?: string | null;
}): Promise<{ ok: true; message: string } | { error: string }> {
  if (!UUID_RE.test(input.requestId)) return { error: "Talep bulunamadı." };
  const admin = await requireAdminClient();
  if ("error" in admin) return admin;
  const { supabase } = admin;
  const request = await loadRequest(supabase, input.requestId);
  if (!request) return { error: "Talep bulunamadı." };
  const note = (input.adminNote || "").trim().slice(0, 500) || null;

  let result: { ok: true; message: string } | { error: string };
  if (input.action === "approve") result = await approveRequest(supabase, request, note);
  else if (input.action === "reject") result = await rejectRequest(supabase, request, note);
  else if (input.action === "receive") result = await receiveRequest(supabase, request, note);
  else result = await completeRequest(supabase, request, note);

  if ("ok" in result) {
    const statusMap = {
      approve: "ONAYLANDI",
      reject: "REDDEDILDI",
      receive: "TESLIM_ALINDI",
      complete: "TAMAMLANDI",
    } as const;
    try {
      const { sendServiceRequestStatusEmail } = await import("@/lib/transactional-emails");
      await sendServiceRequestStatusEmail(supabase, request.id, statusMap[input.action]);
    } catch (err) {
      console.error("[service-request-mail]", err);
    }
  }
  return result;
}

async function approveRequest(
  supabase: SupabaseClient,
  request: RequestRow,
  note: string | null
): Promise<{ ok: true; message: string } | { error: string }> {
  if (request.status !== "TALEP") return { error: "Yalnızca yeni talepler onaylanır." };

  if (request.request_type === "SIZE_EXCHANGE") {
    const { data: itemData } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("id", request.order_item_id)
      .maybeSingle();
    const productId = (itemData as { product_id: string | null } | null)?.product_id;
    if (!productId || !request.to_size) return { error: "Değişim bedeni bulunamadı." };
    const reserved = await adjustProductSizeStock(supabase, productId, request.to_size, -Number(request.quantity));
    if (!reserved.ok) return reserved;
    const { data: updated, error } = await supabase
      .from("order_service_requests")
      .update({ status: "ONAYLANDI", stock_reserved: true, admin_note: note })
      .eq("id", request.id)
      .eq("status", "TALEP")
      .select("id");
    if (error || !(updated ?? []).length) {
      await adjustProductSizeStock(supabase, productId, request.to_size, Number(request.quantity));
      return { error: error?.message || "Talep onaylanamadı." };
    }
    return { ok: true, message: "Talep onaylandı. Yeni bedenin stoğu ayrıldı." };
  }

  const { data: updated, error } = await supabase
    .from("order_service_requests")
    .update({ status: "ONAYLANDI", admin_note: note })
    .eq("id", request.id)
    .eq("status", "TALEP")
    .select("id");
  if (error) return { error: error.message };
  if (!(updated ?? []).length) return { error: "Talep bu durumda onaylanamaz." };
  return { ok: true, message: "İade talebi onaylandı. Ürün gelince teslim alındı deyin." };
}

async function rejectRequest(
  supabase: SupabaseClient,
  request: RequestRow,
  note: string | null
): Promise<{ ok: true; message: string } | { error: string }> {
  if (request.status !== "TALEP" && request.status !== "ONAYLANDI") {
    return { error: "Ürün teslim alındıktan sonra talep reddedilemez." };
  }
  if (request.old_stock_restored) return { error: "Ürün stoğa alındıktan sonra red yerine süreci tamamlayın." };

  if (request.stock_reserved && request.to_size) {
    const claimed = await claimFlag(supabase, request.id, "stock_reserved", false);
    if (claimed) {
      const { data: itemData } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("id", request.order_item_id)
        .maybeSingle();
      const productId = (itemData as { product_id: string | null } | null)?.product_id;
      if (!productId) {
        await claimFlag(supabase, request.id, "stock_reserved", true);
        return { error: "Ürün bulunamadığı için ayrılan stok geri açılamadı." };
      }
      const released = await adjustProductSizeStock(supabase, productId, request.to_size, Number(request.quantity));
      if (!released.ok) {
        await claimFlag(supabase, request.id, "stock_reserved", true);
        return released;
      }
    }
  }

  const { data: updated, error } = await supabase
    .from("order_service_requests")
    .update({ status: "REDDEDILDI", admin_note: note, resolved_at: new Date().toISOString(), stock_reserved: false })
    .eq("id", request.id)
    .in("status", ["TALEP", "ONAYLANDI"])
    .select("id");
  if (error) return { error: error.message };
  if (!(updated ?? []).length) return { error: "Talep bu durumda reddedilemez." };
  return { ok: true, message: "Talep reddedildi." };
}

async function receiveRequest(
  supabase: SupabaseClient,
  request: RequestRow,
  note: string | null
): Promise<{ ok: true; message: string } | { error: string }> {
  if (request.status !== "ONAYLANDI") return { error: "Önce talebi onaylayın." };

  if (request.request_type === "SIZE_EXCHANGE" && !request.old_stock_restored) {
    const claimed = await claimFlag(supabase, request.id, "old_stock_restored", true);
    if (claimed) {
      const { data: itemData } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("id", request.order_item_id)
        .maybeSingle();
      const productId = (itemData as { product_id: string | null } | null)?.product_id;
      if (!productId || !request.from_size) {
        await claimFlag(supabase, request.id, "old_stock_restored", false);
        return { error: "Eski bedenin stoğu geri yazılamadı." };
      }
      const restored = await adjustProductSizeStock(supabase, productId, request.from_size, Number(request.quantity));
      if (!restored.ok) {
        await claimFlag(supabase, request.id, "old_stock_restored", false);
        return restored;
      }
    }
  }

  const { data: updated, error } = await supabase
    .from("order_service_requests")
    .update({ status: "TESLIM_ALINDI", admin_note: note })
    .eq("id", request.id)
    .eq("status", "ONAYLANDI")
    .select("id");
  if (error) return { error: error.message };
  if (!(updated ?? []).length) return { error: "Talep teslim alındı yapılamadı." };
  return { ok: true, message: "Ürün teslim alındı olarak işaretlendi." };
}

async function completeRequest(
  supabase: SupabaseClient,
  request: RequestRow,
  note: string | null
): Promise<{ ok: true; message: string } | { error: string }> {
  if (request.status !== "TESLIM_ALINDI") return { error: "Önce ürünün teslim alındığını işaretleyin." };
  if (request.request_type === "SIZE_EXCHANGE") return completeExchange(supabase, request, note);
  return completeReturn(supabase, request, note);
}

async function completeExchange(
  supabase: SupabaseClient,
  request: RequestRow,
  note: string | null
): Promise<{ ok: true; message: string } | { error: string }> {
  if (!request.to_size) return { error: "Yeni beden bulunamadı." };
  const { error: itemError } = await supabase
    .from("order_items")
    .update({ size: request.to_size })
    .eq("id", request.order_item_id);
  if (itemError) return { error: itemError.message };

  const { data: updated, error } = await supabase
    .from("order_service_requests")
    .update({ status: "TAMAMLANDI", admin_note: note, resolved_at: new Date().toISOString() })
    .eq("id", request.id)
    .eq("status", "TESLIM_ALINDI")
    .select("id");
  if (error) return { error: error.message };
  if (!(updated ?? []).length) return { error: "Değişim tamamlanamadı." };
  return { ok: true, message: "Beden değişimi tamamlandı. Yeni beden teslim edilebilir." };
}

async function completeReturn(
  supabase: SupabaseClient,
  request: RequestRow,
  note: string | null
): Promise<{ ok: true; message: string } | { error: string }> {
  const { data: orderData } = await supabase.from("orders").select(ORDER_COLUMNS).eq("id", request.order_id).maybeSingle();
  const order = orderData as OrderRow | null;
  if (!order) return { error: "Sipariş bulunamadı." };
  if (order.payment_status !== "PAID") return { error: "Sipariş ödenmiş durumda değil." };
  if ((order.payment_method ?? "").toLowerCase() !== "iyzico" || !order.payment_id?.trim()) {
    return { error: "Otomatik para iadesi yalnızca iyzico ödemelerinde yapılır." };
  }

  const { data: itemData } = await supabase
    .from("order_items")
    .select("id, product_id, price, quantity")
    .eq("id", request.order_item_id)
    .maybeSingle();
  const item = itemData as { id: string; product_id: string | null; price: number; quantity: number } | null;
  if (!item) return { error: "Sipariş kalemi bulunamadı." };

  let refundAmount = request.refund_amount == null ? null : roundMoney(Number(request.refund_amount));
  let hostReference = request.refund_host_reference;
  let alreadyCharged = request.refund_amount != null;
  const marker = `[IADE TALEP ${request.id}]`;
  if (!alreadyCharged && order.notes?.includes(marker)) {
    const match = order.notes.match(new RegExp(`\\[IADE TALEP ${request.id}\\] tutar: ([0-9.]+) ref: (\\S+)`));
    if (match) {
      refundAmount = roundMoney(Number(match[1]));
      hostReference = match[2] === "—" ? null : match[2];
      alreadyCharged = true;
    }
  }

  if (!alreadyCharged) {
    const prior = await completedRefundTotal(supabase, order.id);
    if (!prior.ok) return { error: prior.error };
    const { data: allItems } = await supabase.from("order_items").select("id, quantity").eq("order_id", order.id);
    const { data: doneReturns } = await supabase
      .from("order_service_requests")
      .select("order_item_id, quantity")
      .eq("order_id", order.id)
      .eq("request_type", "RETURN")
      .eq("status", "TAMAMLANDI");
    const returnedByItem = new Map<string, number>();
    for (const row of doneReturns ?? []) {
      const typed = row as { order_item_id: string; quantity: number };
      returnedByItem.set(typed.order_item_id, (returnedByItem.get(typed.order_item_id) ?? 0) + Number(typed.quantity || 0));
    }
    returnedByItem.set(item.id, (returnedByItem.get(item.id) ?? 0) + Number(request.quantity));
    const completesOrder = (allItems ?? []).every((row) => {
      const typed = row as { id: string; quantity: number };
      return (returnedByItem.get(typed.id) ?? 0) >= Number(typed.quantity);
    });
    const lineAmount = roundMoney(Number(item.price) * Number(request.quantity));
    const remaining = roundMoney(Number(order.total) - prior.amount);
    refundAmount = completesOrder ? remaining : Math.min(lineAmount, remaining);
    if (refundAmount <= 0) return { error: "İade edilecek tutar kalmadı." };

    let refundRes: Awaited<ReturnType<typeof refundPaymentV2>>;
    try {
      refundRes = await refundPaymentV2({ paymentId: order.payment_id.trim(), price: refundAmount });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { error: `iyzico: ${message}` };
    }
    if (refundRes.status !== "success") {
      return { error: refundRes.errorMessage || refundRes.errorCode || "İade reddedildi." };
    }
    hostReference = refundRes.refundHostReference ?? null;
    const markerLine = `${marker} tutar: ${refundAmount} ref: ${hostReference ?? "—"}`;
    await supabase
      .from("orders")
      .update({ notes: appendNote(order.notes, markerLine), updated_at: new Date().toISOString() })
      .eq("id", order.id);
    order.notes = appendNote(order.notes, markerLine);
    const { error: saveError } = await supabase
      .from("order_service_requests")
      .update({ refund_amount: refundAmount, refund_host_reference: hostReference })
      .eq("id", request.id)
      .eq("status", "TESLIM_ALINDI");
    if (saveError) {
      return { error: "Para iadesi alındı. Kaydı tamamlamak için bu talebi yeniden tamamlayın; ikinci çekim yapılmaz." };
    }
  }

  if (!request.old_stock_restored && item.product_id && request.from_size) {
    const claimed = await claimFlag(supabase, request.id, "old_stock_restored", true);
    if (claimed) {
      const restored = await adjustProductSizeStock(supabase, item.product_id, request.from_size, Number(request.quantity));
      if (!restored.ok) {
        await claimFlag(supabase, request.id, "old_stock_restored", false);
        return { error: `Para iadesi alındı ancak stok yazılamadı: ${restored.error}` };
      }
    }
  } else if (!request.old_stock_restored) {
    await claimFlag(supabase, request.id, "old_stock_restored", true);
  }

  const amount = refundAmount ?? 0;
  if (!request.spend_reversed && amount > 0) {
    const claimed = await claimFlag(supabase, request.id, "spend_reversed", true);
    if (claimed) {
      await reverseFanStoreSpendForOrder(supabase, {
        user_id: order.user_id,
        guest_email: order.guest_email,
        total: amount,
      });
    }
  }

  const priorAfter = await completedRefundTotal(supabase, order.id);
  const already = priorAfter.ok ? priorAfter.amount : 0;
  const refundedNow = roundMoney(already + amount);
  const fullyRefunded = roundMoney(Number(order.total) - refundedNow) <= 0;
  const markerLine = `${marker} tutar: ${amount} ref: ${hostReference ?? "—"}`;
  const notes = order.notes?.includes(marker) ? order.notes : appendNote(order.notes, markerLine);

  const { error: orderError } = await supabase
    .from("orders")
    .update({
      payment_status: fullyRefunded ? "REFUNDED" : "PAID",
      status: fullyRefunded ? "CANCELLED" : order.status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);
  if (orderError) return { error: "Para iadesi alındı ancak sipariş notu yazılamadı." };

  const { data: updated, error } = await supabase
    .from("order_service_requests")
    .update({
      status: "TAMAMLANDI",
      admin_note: note,
      resolved_at: new Date().toISOString(),
      refund_amount: amount,
      refund_host_reference: hostReference,
    })
    .eq("id", request.id)
    .eq("status", "TESLIM_ALINDI")
    .select("id");
  if (error) return { error: error.message };
  if (!(updated ?? []).length) return { error: "İade kaydı kapanamadı. Sayfayı yenileyip tekrar deneyin." };

  if (fullyRefunded) {
    try {
      await cancelInvoiceForRefundedOrder(order.id);
    } catch (err) {
      console.error("Uyum fatura iptal:", err);
    }
  }

  return {
    ok: true,
    message: fullyRefunded
      ? "İade tamamlandı. Siparişin tamamı geri ödendi."
      : `Kısmi iade tamamlandı (${amount.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}).`,
  };
}

export async function fullRefundPlan(
  supabase: SupabaseClient,
  orderId: string,
  orderTotal: number
): Promise<{ error: string } | { remaining: number }> {
  const { data, error } = await supabase
    .from("order_service_requests")
    .select("status, request_type, refund_amount")
    .eq("order_id", orderId);
  if (error) return { error: error.message };
  const rows = (data ?? []) as Pick<RequestRow, "status" | "request_type" | "refund_amount">[];
  if (rows.some((row) => OPEN_SERVICE_STATUSES.includes(row.status))) {
    return { error: "Bu siparişte açık iade veya beden değişimi talebi var. Önce talebi sonuçlandırın." };
  }
  const already = roundMoney(
    rows
      .filter((row) => row.request_type === "RETURN" && row.status === "TAMAMLANDI")
      .reduce((sum, row) => sum + (Number(row.refund_amount) || 0), 0)
  );
  const remaining = roundMoney(orderTotal - already);
  if (remaining <= 0) return { error: "Bu siparişin tamamı zaten iade edilmiş." };
  return { remaining };
}

export async function closeOpenServiceRequests(supabase: SupabaseClient, orderId: string): Promise<void> {
  await supabase
    .from("order_service_requests")
    .update({
      status: "IPTAL",
      admin_note: "Sipariş tam iade edildi.",
      resolved_at: new Date().toISOString(),
      stock_reserved: false,
    })
    .eq("order_id", orderId)
    .in("status", OPEN_SERVICE_STATUSES);
}
