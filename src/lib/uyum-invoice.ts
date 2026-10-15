import { createServiceRoleClient } from "@/lib/supabase/service";
import { FALLBACK_TCKN, resolveBuyerTaxId } from "@/lib/tax-id";

const INVOICE_AFTER_MS = 4 * 24 * 60 * 60 * 1000;

const SOAP_NS = "http://tempuri.org/";
const DEFAULT_ENDPOINT = "http://edonusumapi.uyum.com.tr/Services/BasicIntegration";

type InvoiceConfig = {
  username: string;
  password: string;
  vkn: string;
  title: string;
  taxOffice: string;
  address: string;
  city: string;
  district: string;
  email: string;
  phone: string;
  prefix: string;
  vatRate: number;
  endpoint: string;
  webAddress: string;
  carrierVkn: string;
  carrierName: string;
};

type OrderForInvoice = {
  id: string;
  order_number: string;
  notes: string | null;
  guest_email: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  shipping_address: Record<string, unknown> | null;
  shipping_cost: number;
  total: number;
  payment_status: string;
  delivery_method: string | null;
  updated_at: string | null;
};

export type InvoiceNoteState = "none" | "issued" | "skipped" | "failed" | "sending";

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function moneyText(n: number): string {
  return money(n).toFixed(2);
}

function stamp(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function seriesPrefix(raw: string): string {
  const letters = raw.replace(/[^A-Za-z]/g, "").toUpperCase();
  return (letters + "GFK").slice(0, 3);
}

/** Aynı sipariş numarası her denemede aynı fatura numarasını üretir. */
export function invoiceNumberForOrder(prefix: string, orderNumber: string, year = new Date().getFullYear()): string {
  let hash = 0;
  for (const ch of orderNumber) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  const seq = String(hash % 1_000_000_000).padStart(9, "0");
  return `${seriesPrefix(prefix)}${year}${seq}`;
}

export function paidAtFromNotes(notes: string | null | undefined): Date | null {
  const match = (notes || "").match(/\[ODEME\]\s*(\S+)/);
  if (!match) return null;
  const paidAt = new Date(match[1]);
  return Number.isFinite(paidAt.getTime()) ? paidAt : null;
}

export function invoiceIsDue(notes: string | null | undefined, now = Date.now()): boolean {
  const paidAt = paidAtFromNotes(notes);
  if (!paidAt) return false;
  return now >= paidAt.getTime() + INVOICE_AFTER_MS;
}

export function invoiceNoteState(notes: string | null | undefined): InvoiceNoteState {
  const lines = (notes || "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("[FATURA]"));
  const last = lines.at(-1) || "";
  if (!last) return "none";
  if (last.includes(" issued ")) return "issued";
  if (last.includes(" skipped ")) return "skipped";
  if (last.includes(" sending ")) {
    const match = last.match(/sending (\S+)/);
    const at = match ? Date.parse(match[1]) : NaN;
    if (Number.isFinite(at) && Date.now() - at < 2 * 60 * 1000) return "sending";
    return "failed";
  }
  return "failed";
}

function upsertInvoiceNote(notes: string | null, line: string): string {
  const parts = (notes || "").split("\n");
  const index = parts.findLastIndex((part) => part.trim().startsWith("[FATURA]"));
  if (index >= 0) parts[index] = line;
  else parts.push(line);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function readConfig(): InvoiceConfig | null {
  const username = process.env.UYUM_USERNAME?.trim() || "";
  const password = process.env.UYUM_PASSWORD?.trim() || "";
  const vkn = (process.env.UYUM_SUPPLIER_VKN || "").replace(/\D/g, "");
  const title = process.env.UYUM_SUPPLIER_TITLE?.trim() || "";
  const taxOffice = process.env.UYUM_SUPPLIER_TAX_OFFICE?.trim() || "";
  const address = process.env.UYUM_SUPPLIER_ADDRESS?.trim() || "";
  if (!username || !password || vkn.length !== 10 || !title || !taxOffice || !address) return null;
  const vatRate = Number(process.env.UYUM_VAT_RATE || "10");
  return {
    username,
    password,
    vkn,
    title,
    taxOffice,
    address,
    city: process.env.UYUM_SUPPLIER_CITY?.trim() || "İstanbul",
    district: process.env.UYUM_SUPPLIER_DISTRICT?.trim() || "",
    email: process.env.UYUM_SUPPLIER_EMAIL?.trim() || "",
    phone: process.env.UYUM_SUPPLIER_PHONE?.trim() || "",
    prefix: process.env.UYUM_INVOICE_PREFIX?.trim() || "GFK",
    vatRate: Number.isFinite(vatRate) && vatRate >= 0 && vatRate < 100 ? vatRate : 10,
    endpoint: process.env.UYUM_API_URL?.trim() || DEFAULT_ENDPOINT,
    webAddress: process.env.UYUM_WEB_ADDRESS?.trim() || process.env.NEXT_PUBLIC_BASE_URL || "https://gungorenspor.com",
    carrierVkn: (process.env.UYUM_CARRIER_VKN || vkn).replace(/\D/g, "") || vkn,
    carrierName: process.env.UYUM_CARRIER_NAME?.trim() || title,
  };
}

function splitGross(gross: number, rate: number): { net: number; vat: number; gross: number } {
  const safeGross = money(gross);
  const net = money(safeGross / (1 + rate / 100));
  return { net, vat: money(safeGross - net), gross: safeGross };
}

async function soap(endpoint: string, action: string, body: string): Promise<string> {
  const envelope =
    `<?xml version="1.0" encoding="utf-8"?>` +
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="${SOAP_NS}">` +
    `<soap:Body>${body}</soap:Body></soap:Envelope>`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `"${SOAP_NS}IBasicIntegration/${action}"`,
    },
    body: envelope,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Uyum HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  return text;
}

function attr(chunk: string, name: string): string {
  const match = chunk.match(new RegExp(`\\b${name}="([^"]*)"`));
  return match?.[1] ?? "";
}

export function parseIssuedInvoice(notes: string | null | undefined): { scenario: string; number: string; ettn: string; issueDate: string } | null {
  const line = (notes || "")
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.startsWith("[FATURA] issued"));
  if (!line) return null;
  const parts = line.split("|").map((part) => part.trim());
  const ettn = parts[3] || "";
  if (!ettn) return null;
  return { scenario: parts[1] || "", number: parts[2] || "", ettn, issueDate: parts[4] || "" };
}

export function parseReturnInvoice(notes: string | null | undefined): { scenario: string; number: string; ettn: string } | null {
  const line = (notes || "")
    .split("\n")
    .map((part) => part.trim())
    .find((part) => part.startsWith("[IADE] issued"));
  if (!line) return null;
  const parts = line.split("|").map((part) => part.trim());
  const ettn = parts[3] || "";
  if (!ettn) return null;
  return { scenario: parts[1] || "", number: parts[2] || "", ettn };
}

function upsertTaggedNote(notes: string | null, tag: string, line: string): string {
  const parts = (notes || "").split("\n");
  const index = parts.findLastIndex((part) => part.trim().startsWith(tag));
  if (index >= 0) parts[index] = line;
  else parts.push(line);
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** e-Arşiv, düzenleme gününden sonraki 7. günün sonuna kadar iptal edilebilir. */
function eArchiveCancelOpen(issueDate: string, now = new Date()): boolean {
  const start = new Date(`${issueDate}T00:00:00+03:00`);
  if (!Number.isFinite(start.getTime())) return false;
  const end = start.getTime() + 8 * 24 * 60 * 60 * 1000 - 1;
  return now.getTime() <= end;
}

async function fetchOutboxInvoicePdf(config: InvoiceConfig, invoiceId: string): Promise<Buffer> {
  const body =
    `<tem:GetOutboxInvoicePdf>` +
    `<tem:userInfo Username="${xml(config.username)}" Password="${xml(config.password)}"/>` +
    `<tem:invoiceId>${xml(invoiceId)}</tem:invoiceId>` +
    `</tem:GetOutboxInvoicePdf>`;
  const response = await soap(config.endpoint, "GetOutboxInvoicePdf", body);
  const result = response.match(/GetOutboxInvoicePdfResult\b[^>]*/)?.[0] || "";
  if (attr(result, "IsSucceded").toLowerCase() !== "true") {
    throw new Error(attr(result, "Message") || "Fatura PDF alınamadı");
  }
  const data = response.match(/<[^>]*\bData\b[^>]*>([^<]+)<\/[^>]*\bData>/)?.[1]?.replace(/\s/g, "") || "";
  if (!data) throw new Error("Fatura PDF boş döndü");
  return Buffer.from(data, "base64");
}

export async function loadOrderInvoicePdf(orderId: string, kind: "sale" | "return" = "sale"): Promise<{ number: string; pdf: Buffer }> {
  const config = readConfig();
  if (!config) throw new Error("Uyum ayarı eksik");
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("orders").select("order_number, notes").eq("id", orderId).maybeSingle();
  if (!data) throw new Error("Sipariş bulunamadı");
  const row = data as { order_number: string; notes: string | null };
  const issued = kind === "return" ? parseReturnInvoice(row.notes) : parseIssuedInvoice(row.notes);
  if (!issued) throw new Error(kind === "return" ? "Bu siparişin iade faturası yok" : "Bu siparişin kesilmiş faturası yok");
  const pdf = await fetchOutboxInvoicePdf(config, issued.ettn);
  return { number: issued.number || row.order_number, pdf };
}

async function fetchOutboxIssueDate(config: InvoiceConfig, invoiceId: string): Promise<string> {
  const body =
    `<tem:GetOutboxInvoice>` +
    `<tem:userInfo Username="${xml(config.username)}" Password="${xml(config.password)}"/>` +
    `<tem:invoiceId>${xml(invoiceId)}</tem:invoiceId>` +
    `</tem:GetOutboxInvoice>`;
  const response = await soap(config.endpoint, "GetOutboxInvoice", body);
  const result = response.match(/GetOutboxInvoiceResult\b[^>]*/)?.[0] || "";
  if (attr(result, "IsSucceded").toLowerCase() !== "true") {
    throw new Error(attr(result, "Message") || "Fatura tarihi alınamadı");
  }
  const decoded = response.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const date = decoded.match(/<(?:\w+:)?IssueDate>([^<]+)</)?.[1]?.slice(0, 10) || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Fatura tarihi okunamadı");
  return date;
}

async function isEInvoiceUser(config: InvoiceConfig, taxId: string): Promise<boolean> {
  const body =
    `<tem:IsEInvoiceUser>` +
    `<tem:userInfo Username="${xml(config.username)}" Password="${xml(config.password)}"/>` +
    `<tem:vknTckn>${xml(taxId)}</tem:vknTckn>` +
    `<tem:alias></tem:alias>` +
    `</tem:IsEInvoiceUser>`;
  const response = await soap(config.endpoint, "IsEInvoiceUser", body);
  const result = response.match(/IsEInvoiceUserResult\b[^>]*/)?.[0] || response;
  if (attr(result, "IsSucceded").toLowerCase() !== "true") {
    throw new Error(attr(result, "Message") || "e-Fatura mükellef sorgusu başarısız");
  }
  return attr(result, "Value").toLowerCase() === "true";
}

function partyXml(input: {
  scheme: "VKN" | "TCKN";
  id: string;
  title?: string;
  firstName?: string;
  familyName?: string;
  address: string;
  district: string;
  city: string;
  taxOffice?: string;
  email?: string;
  phone?: string;
}): string {
  const person = input.scheme === "TCKN"
    ? `<cac:Person><cbc:FirstName>${xml(input.firstName || "Müşteri")}</cbc:FirstName><cbc:FamilyName>${xml(input.familyName || "Müşteri")}</cbc:FamilyName></cac:Person>`
    : "";
  const title = input.scheme === "VKN" || input.title
    ? `<cac:PartyName><cbc:Name>${xml(input.title || `${input.firstName || ""} ${input.familyName || ""}`.trim())}</cbc:Name></cac:PartyName>`
    : "";
  const tax = input.taxOffice
    ? `<cac:PartyTaxScheme><cac:TaxScheme><cbc:Name>${xml(input.taxOffice)}</cbc:Name></cac:TaxScheme></cac:PartyTaxScheme>`
    : "";
  return (
    `<cac:Party>` +
    `<cac:PartyIdentification><cbc:ID schemeID="${input.scheme}">${xml(input.id)}</cbc:ID></cac:PartyIdentification>` +
    title +
    `<cac:PostalAddress>` +
    `<cbc:StreetName>${xml(input.address || "-")}</cbc:StreetName>` +
    `<cbc:CitySubdivisionName>${xml(input.district || input.city || "-")}</cbc:CitySubdivisionName>` +
    `<cbc:CityName>${xml(input.city || "İstanbul")}</cbc:CityName>` +
    `<cac:Country><cbc:Name>Türkiye</cbc:Name></cac:Country>` +
    `</cac:PostalAddress>` +
    tax +
    `<cac:Contact>` +
    (input.phone ? `<cbc:Telephone>${xml(input.phone)}</cbc:Telephone>` : "") +
    (input.email ? `<cbc:ElectronicMail>${xml(input.email)}</cbc:ElectronicMail>` : "") +
    `</cac:Contact>` +
    person +
    `</cac:Party>`
  );
}

function buildInvoiceXml(input: {
  config: InvoiceConfig;
  order: OrderForInvoice;
  taxId: string;
  eInvoice: boolean;
  lines: { name: string; quantity: number; gross: number }[];
  issuedAt: Date;
  returnOf?: { number: string; issueDate: string };
}): string {
  const { config, order, taxId, eInvoice, lines, issuedAt } = input;
  const addr = order.shipping_address || {};
  const fullName = String(addr.fullName || order.guest_name || "Müşteri").trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || "Müşteri";
  const familyName = nameParts.slice(1).join(" ") || "Müşteri";
  const city = String(addr.city || "İstanbul");
  const district = String(addr.district || "");
  const address = String(addr.address || (order.delivery_method === "store_pickup" ? "Mağazadan teslim" : "-"));
  const email = String(addr.email || order.guest_email || "");
  const phone = String(addr.phone || order.guest_phone || "");
  const customerScheme = taxId.length === 10 ? "VKN" : "TCKN";
  const profile = eInvoice ? "TEMELFATURA" : "EARSIVFATURA";
  const numberKey = input.returnOf ? `${order.order_number}-IADE` : order.order_number;
  const number = invoiceNumberForOrder(config.prefix, numberKey, issuedAt.getFullYear());
  const uuid = crypto.randomUUID();
  const date = issuedAt.toISOString().slice(0, 10);
  const time = issuedAt.toISOString().slice(11, 19);

  const priced = lines.map((line) => ({ ...line, ...splitGross(line.gross, config.vatRate) }));
  const net = money(priced.reduce((sum, line) => sum + line.net, 0));
  const vat = money(priced.reduce((sum, line) => sum + line.vat, 0));
  const gross = money(priced.reduce((sum, line) => sum + line.gross, 0));

  const lineXml = priced
    .map((line, index) => {
      const unit = line.quantity > 0 ? money(line.net / line.quantity) : line.net;
      return (
        `<cac:InvoiceLine>` +
        `<cbc:ID>${index + 1}</cbc:ID>` +
        `<cbc:InvoicedQuantity unitCode="C62">${line.quantity}</cbc:InvoicedQuantity>` +
        `<cbc:LineExtensionAmount currencyID="TRY">${moneyText(line.net)}</cbc:LineExtensionAmount>` +
        `<cac:TaxTotal><cbc:TaxAmount currencyID="TRY">${moneyText(line.vat)}</cbc:TaxAmount>` +
        `<cac:TaxSubtotal>` +
        `<cbc:TaxableAmount currencyID="TRY">${moneyText(line.net)}</cbc:TaxableAmount>` +
        `<cbc:TaxAmount currencyID="TRY">${moneyText(line.vat)}</cbc:TaxAmount>` +
        `<cbc:Percent>${config.vatRate}</cbc:Percent>` +
        `<cac:TaxCategory><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>` +
        `</cac:TaxSubtotal></cac:TaxTotal>` +
        `<cac:Item><cbc:Name>${xml(line.name)}</cbc:Name></cac:Item>` +
        `<cac:Price><cbc:PriceAmount currencyID="TRY">${moneyText(unit)}</cbc:PriceAmount></cac:Price>` +
        `</cac:InvoiceLine>`
      );
    })
    .join("");

  return (
    `<cbc:UBLVersionID>2.1</cbc:UBLVersionID>` +
    `<cbc:CustomizationID>TR1.2</cbc:CustomizationID>` +
    `<cbc:ProfileID>${profile}</cbc:ProfileID>` +
    `<cbc:ID>${xml(number)}</cbc:ID>` +
    `<cbc:CopyIndicator>false</cbc:CopyIndicator>` +
    `<cbc:UUID>${uuid}</cbc:UUID>` +
    `<cbc:IssueDate>${date}</cbc:IssueDate>` +
    `<cbc:IssueTime>${time}</cbc:IssueTime>` +
    `<cbc:InvoiceTypeCode>${input.returnOf ? "IADE" : "SATIS"}</cbc:InvoiceTypeCode>` +
    `<cbc:Note>${xml(input.returnOf ? `${order.order_number} iade faturası. İlk fatura ${input.returnOf.number}.` : `${order.order_number} internet satışı. Tutarlar KDV dahildir.`)}</cbc:Note>` +
    `<cbc:DocumentCurrencyCode>TRY</cbc:DocumentCurrencyCode>` +
    `<cbc:LineCountNumeric>${priced.length}</cbc:LineCountNumeric>` +
    (input.returnOf
      ? `<cac:BillingReference><cac:InvoiceDocumentReference><cbc:ID>${xml(input.returnOf.number)}</cbc:ID><cbc:IssueDate>${xml(input.returnOf.issueDate)}</cbc:IssueDate><cbc:DocumentTypeCode>SATIS</cbc:DocumentTypeCode><cbc:DocumentType>İade Edilen Fatura</cbc:DocumentType></cac:InvoiceDocumentReference></cac:BillingReference>`
      : "") +
    `<cac:AccountingSupplierParty>${partyXml({
      scheme: "VKN",
      id: config.vkn,
      title: config.title,
      address: config.address,
      district: config.district,
      city: config.city,
      taxOffice: config.taxOffice,
      email: config.email,
      phone: config.phone,
    })}</cac:AccountingSupplierParty>` +
    `<cac:AccountingCustomerParty>${partyXml({
      scheme: customerScheme,
      id: taxId,
      title: customerScheme === "VKN" ? fullName : undefined,
      firstName,
      familyName,
      address,
      district,
      city,
      email,
      phone,
    })}</cac:AccountingCustomerParty>` +
    `<cac:PaymentMeans><cbc:PaymentMeansCode>48</cbc:PaymentMeansCode><cbc:PaymentDueDate>${date}</cbc:PaymentDueDate></cac:PaymentMeans>` +
    `<cac:TaxTotal><cbc:TaxAmount currencyID="TRY">${moneyText(vat)}</cbc:TaxAmount>` +
    `<cac:TaxSubtotal>` +
    `<cbc:TaxableAmount currencyID="TRY">${moneyText(net)}</cbc:TaxableAmount>` +
    `<cbc:TaxAmount currencyID="TRY">${moneyText(vat)}</cbc:TaxAmount>` +
    `<cbc:Percent>${config.vatRate}</cbc:Percent>` +
    `<cac:TaxCategory><cac:TaxScheme><cbc:Name>KDV</cbc:Name><cbc:TaxTypeCode>0015</cbc:TaxTypeCode></cac:TaxScheme></cac:TaxCategory>` +
    `</cac:TaxSubtotal></cac:TaxTotal>` +
    `<cac:LegalMonetaryTotal>` +
    `<cbc:LineExtensionAmount currencyID="TRY">${moneyText(net)}</cbc:LineExtensionAmount>` +
    `<cbc:TaxExclusiveAmount currencyID="TRY">${moneyText(net)}</cbc:TaxExclusiveAmount>` +
    `<cbc:TaxInclusiveAmount currencyID="TRY">${moneyText(gross)}</cbc:TaxInclusiveAmount>` +
    `<cbc:PayableAmount currencyID="TRY">${moneyText(gross)}</cbc:PayableAmount>` +
    `</cac:LegalMonetaryTotal>` +
    lineXml
  );
}

async function saveInvoiceNote(
  orderId: string,
  notes: string,
  extra?: { invoice_status?: string; invoice_number?: string; invoice_ettn?: string; invoice_scenario?: string; buyer_tax_id?: string }
): Promise<void> {
  const supabase = createServiceRoleClient();
  if (extra) {
    const { error } = await supabase.from("orders").update({ notes, ...extra, updated_at: new Date().toISOString() }).eq("id", orderId);
    if (!error) return;
  }
  await supabase.from("orders").update({ notes, updated_at: new Date().toISOString() }).eq("id", orderId);
}

export async function issueInvoiceForPaidOrder(orderId: string, options?: { force?: boolean }): Promise<InvoiceNoteState> {
  const supabase = createServiceRoleClient();
  const { data: orderRow } = await supabase
    .from("orders")
    .select("id, order_number, notes, guest_email, guest_name, guest_phone, shipping_address, shipping_cost, total, payment_status, delivery_method, updated_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!orderRow) return "failed";
  const order = orderRow as OrderForInvoice;
  if (order.payment_status !== "PAID") return invoiceNoteState(order.notes);
  if (!options?.force && !invoiceIsDue(order.notes)) return "none";
  const state = invoiceNoteState(order.notes);
  if (state === "issued" || state === "skipped" || state === "sending") return state;

  const addr = order.shipping_address || {};
  const resolvedTax = resolveBuyerTaxId(String(addr.taxId || ""));
  if ("error" in resolvedTax) {
    const notes = upsertInvoiceNote(order.notes, "[FATURA] skipped | TCKN/VKN geçersiz");
    await saveInvoiceNote(order.id, notes);
    return "skipped";
  }
  const taxId = resolvedTax.taxId;
  const paidAt = paidAtFromNotes(order.notes) || new Date();

  const config = readConfig();
  if (!config) {
    if ((order.notes || "").includes("Uyum ayarı eksik")) return "failed";
    const notes = upsertInvoiceNote(order.notes, "[FATURA] failed | Uyum ayarı eksik");
    await saveInvoiceNote(order.id, notes, { invoice_status: "failed", buyer_tax_id: taxId });
    return "failed";
  }

  const sending = upsertInvoiceNote(order.notes, `[FATURA] sending ${stamp()}`);
  const claim = supabase.from("orders").update({ notes: sending, updated_at: new Date().toISOString() }).eq("id", order.id);
  const { data: claimed } = order.notes == null
    ? await claim.is("notes", null).select("id")
    : await claim.eq("notes", order.notes).select("id");
  if (!claimed?.length) return "sending";

  try {
    const { data: items } = await supabase
      .from("order_items")
      .select("name, price, quantity, size")
      .eq("order_id", order.id);
    const lines = (items ?? []).map((item) => {
      const row = item as { name: string; price: number; quantity: number; size: string | null };
      const size = row.size && row.size !== "tek_beden" ? ` (${row.size})` : "";
      return {
        name: `${row.name}${size}`.slice(0, 200),
        quantity: Math.max(1, Number(row.quantity) || 1),
        gross: money(Number(row.price) * Math.max(1, Number(row.quantity) || 1)),
      };
    });
    const shipping = money(Number(order.shipping_cost) || 0);
    if (shipping > 0) lines.push({ name: "Kargo", quantity: 1, gross: shipping });
    if (lines.length === 0) throw new Error("Fatura kalemi yok");

    const eInvoice = taxId === FALLBACK_TCKN ? false : await isEInvoiceUser(config, taxId);
    const issuedAt = new Date();
    const invoiceXml = buildInvoiceXml({ config, order, taxId, eInvoice, lines, issuedAt });
    const scenario = eInvoice ? "eInvoice" : "eArchive";
    const paymentDate = paidAt.toISOString().replace(/\.\d{3}Z$/, "Z");
    const archive = eInvoice
      ? ""
      : `<tem:EArchiveInvoiceInfo DeliveryType="Electronic">` +
        `<tem:InternetSalesInfo>` +
        `<tem:WebAddress>${xml(config.webAddress)}</tem:WebAddress>` +
        `<tem:PaymentMidierName>iyzico</tem:PaymentMidierName>` +
        `<tem:PaymentType>KREDIKARTI/BANKAKARTI</tem:PaymentType>` +
        `<tem:PaymentDate>${paymentDate}</tem:PaymentDate>` +
        `<tem:ShipmentInfo>` +
        `<tem:SendDate>${paymentDate}</tem:SendDate>` +
        `<tem:Carier SenderTcknVkn="${xml(config.carrierVkn)}" SenderName="${xml(config.carrierName)}"/>` +
        `</tem:ShipmentInfo>` +
        `</tem:InternetSalesInfo>` +
        `</tem:EArchiveInvoiceInfo>`;

    const body =
      `<tem:SendInvoice>` +
      `<tem:userInfo Username="${xml(config.username)}" Password="${xml(config.password)}"/>` +
      `<tem:invoices><tem:InvoiceInfo LocalDocumentId="${xml(order.order_number)}">` +
      `<tem:Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">${invoiceXml}</tem:Invoice>` +
      `<tem:TargetCustomer VknTckn="${xml(taxId)}" Title="${xml(String(addr.fullName || order.guest_name || "Müşteri"))}"/>` +
      archive +
      `<tem:Scenario>${scenario}</tem:Scenario>` +
      `<tem:CreateDateUtc>${stamp()}</tem:CreateDateUtc>` +
      `</tem:InvoiceInfo></tem:invoices>` +
      `</tem:SendInvoice>`;

    const response = await soap(config.endpoint, "SendInvoice", body);
    const result = response.match(/SendInvoiceResult\b[^>]*/)?.[0] || "";
    if (attr(result, "IsSucceded").toLowerCase() !== "true") {
      throw new Error(attr(result, "Message") || "SendInvoice reddedildi");
    }
    const value = response.match(/<[^>]*Value\b[^>]*/)?.[0] || "";
    const ettn = attr(value, "Id");
    const number = attr(value, "Number") || invoiceNumberForOrder(config.prefix, order.order_number);
    const returnedScenario = attr(value, "InvoiceScenario") || scenario;
    const notes = upsertInvoiceNote(sending, `[FATURA] issued | ${returnedScenario} | ${number} | ${ettn} | ${issuedAt.toISOString().slice(0, 10)}`);
    await saveInvoiceNote(order.id, notes, {
      invoice_status: "issued",
      invoice_number: number,
      invoice_ettn: ettn,
      invoice_scenario: returnedScenario,
      buyer_tax_id: taxId,
    });
    return "issued";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Uyum fatura:", order.order_number, message);
    const notes = upsertInvoiceNote(sending, `[FATURA] failed | ${message.slice(0, 240)}`);
    await saveInvoiceNote(order.id, notes, { invoice_status: "failed", buyer_tax_id: taxId });
    return "failed";
  }
}

/** Tek sipariş. force true ise 4 gün beklenmez. */
export async function issueInvoiceForOrderNumber(
  orderNumber: string,
  options?: { force?: boolean }
): Promise<{ ok: boolean; message: string }> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("orders")
    .select("id, notes, payment_status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!data) return { ok: false, message: "Sipariş bulunamadı" };
  const row = data as { id: string; notes: string | null; payment_status: string };
  if (row.payment_status !== "PAID") return { ok: false, message: `Sipariş ödenmemiş: ${row.payment_status}` };
  const state = await issueInvoiceForPaidOrder(row.id, options);
  const { data: after } = await supabase.from("orders").select("notes").eq("id", row.id).maybeSingle();
  const line = String((after as { notes?: string } | null)?.notes || "")
    .split("\n")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("[FATURA]"))
    .at(-1) || state;
  return { ok: state === "issued", message: line };
}

/** Kullanıcı adı ve şifreyi dener. Fatura kesmez. */
export async function probeUyumConnection(): Promise<{ ok: boolean; message: string }> {
  const config = readConfig();
  if (!config) return { ok: false, message: "Uyum ayarı eksik" };
  try {
    const eInvoice = await isEInvoiceUser(config, FALLBACK_TCKN);
    return {
      ok: true,
      message: eInvoice
        ? "Bağlantı tamam. 11111111111 e-Fatura mükellefi göründü."
        : "Bağlantı tamam. 11111111111 e-Arşiv mükellefi.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, message: message.slice(0, 300) };
  }
}

export async function retryRecentStoreInvoices(): Promise<number> {
  const supabase = createServiceRoleClient();
  const dueBefore = new Date(Date.now() - INVOICE_AFTER_MS).toISOString();
  const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("orders")
    .select("id, notes")
    .eq("payment_status", "PAID")
    .lt("created_at", dueBefore)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(20);
  let issued = 0;
  for (const row of data ?? []) {
    const record = row as { id: string; notes: string | null };
    if (!invoiceIsDue(record.notes)) continue;
    const state = invoiceNoteState(record.notes);
    if (state === "issued" || state === "skipped" || state === "sending") continue;
    const next = await issueInvoiceForPaidOrder((row as { id: string }).id);
    if (next === "issued") issued += 1;
  }

  const { data: returns } = await supabase
    .from("orders")
    .select("id, notes")
    .eq("payment_status", "REFUNDED")
    .or("notes.ilike.%[IADE] failed%,notes.ilike.%[FATURA IPTAL] başarısız%")
    .order("updated_at", { ascending: true })
    .limit(10);
  for (const row of returns ?? []) {
    const record = row as { id: string; notes: string | null };
    if ((record.notes || "").includes("[IADE] issued")) continue;
    await cancelInvoiceForRefundedOrder(record.id);
    const { data: after } = await supabase.from("orders").select("notes").eq("id", record.id).maybeSingle();
    const notes = (after as { notes: string | null } | null)?.notes || "";
    if (notes.includes("[IADE] issued") || notes.includes("[FATURA IPTAL] e-Arşiv iptal edildi")) issued += 1;
  }
  return issued;
}

async function issueReturnInvoice(orderId: string, original: { number: string; issueDate: string; scenario: string }): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: orderRow } = await supabase
    .from("orders")
    .select("id, order_number, notes, guest_email, guest_name, guest_phone, shipping_address, shipping_cost, total, payment_status, delivery_method, updated_at")
    .eq("id", orderId)
    .maybeSingle();
  if (!orderRow) return;
  const order = orderRow as OrderForInvoice;
  if (parseReturnInvoice(order.notes)) return;
  const config = readConfig();
  if (!config) {
    await saveInvoiceNote(orderId, upsertTaggedNote(order.notes, "[IADE]", "[IADE] failed | Uyum ayarı eksik"));
    return;
  }
  const addr = order.shipping_address || {};
  const resolvedTax = resolveBuyerTaxId(String(addr.taxId || ""));
  if ("error" in resolvedTax) {
    await saveInvoiceNote(orderId, upsertTaggedNote(order.notes, "[IADE]", "[IADE] failed | TCKN/VKN geçersiz"));
    return;
  }
  const taxId = resolvedTax.taxId;
  const eInvoice = original.scenario.toLowerCase().includes("einvoice");
  const { data: items } = await supabase.from("order_items").select("name, price, quantity, size").eq("order_id", order.id);
  const lines = (items ?? []).map((item) => {
    const row = item as { name: string; price: number; quantity: number; size: string | null };
    const size = row.size && row.size !== "tek_beden" ? ` (${row.size})` : "";
    return {
      name: `${row.name}${size}`.slice(0, 200),
      quantity: Math.max(1, Number(row.quantity) || 1),
      gross: money(Number(row.price) * Math.max(1, Number(row.quantity) || 1)),
    };
  });
  const shipping = money(Number(order.shipping_cost) || 0);
  if (shipping > 0) lines.push({ name: "Kargo", quantity: 1, gross: shipping });
  if (lines.length === 0) throw new Error("İade fatura kalemi yok");

  const issuedAt = new Date();
  const invoiceXml = buildInvoiceXml({
    config,
    order,
    taxId,
    eInvoice,
    lines,
    issuedAt,
    returnOf: { number: original.number, issueDate: original.issueDate },
  });
  const scenario = eInvoice ? "eInvoice" : "eArchive";
  const nowStamp = stamp();
  const archive = eInvoice
    ? ""
    : `<tem:EArchiveInvoiceInfo DeliveryType="Electronic">` +
      `<tem:InternetSalesInfo>` +
      `<tem:WebAddress>${xml(config.webAddress)}</tem:WebAddress>` +
      `<tem:PaymentMidierName>iyzico</tem:PaymentMidierName>` +
      `<tem:PaymentType>KREDIKARTI/BANKAKARTI</tem:PaymentType>` +
      `<tem:PaymentDate>${nowStamp}</tem:PaymentDate>` +
      `<tem:ShipmentInfo>` +
      `<tem:SendDate>${nowStamp}</tem:SendDate>` +
      `<tem:Carier SenderTcknVkn="${xml(config.carrierVkn)}" SenderName="${xml(config.carrierName)}"/>` +
      `</tem:ShipmentInfo>` +
      `</tem:InternetSalesInfo>` +
      `</tem:EArchiveInvoiceInfo>`;
  const body =
    `<tem:SendInvoice>` +
    `<tem:userInfo Username="${xml(config.username)}" Password="${xml(config.password)}"/>` +
    `<tem:invoices><tem:InvoiceInfo LocalDocumentId="${xml(order.order_number + "-IADE")}">` +
    `<tem:Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">${invoiceXml}</tem:Invoice>` +
    `<tem:TargetCustomer VknTckn="${xml(taxId)}" Title="${xml(String(addr.fullName || order.guest_name || "Müşteri"))}"/>` +
    archive +
    `<tem:Scenario>${scenario}</tem:Scenario>` +
    `<tem:CreateDateUtc>${nowStamp}</tem:CreateDateUtc>` +
    `</tem:InvoiceInfo></tem:invoices>` +
    `</tem:SendInvoice>`;
  const response = await soap(config.endpoint, "SendInvoice", body);
  const result = response.match(/SendInvoiceResult\b[^>]*/)?.[0] || "";
  if (attr(result, "IsSucceded").toLowerCase() !== "true") {
    throw new Error(attr(result, "Message") || "İade faturası reddedildi");
  }
  const value = response.match(/<[^>]*Value\b[^>]*/)?.[0] || "";
  const ettn = attr(value, "Id");
  const number = attr(value, "Number") || invoiceNumberForOrder(config.prefix, `${order.order_number}-IADE`);
  const returnedScenario = attr(value, "InvoiceScenario") || scenario;
  const freshNotes = (await supabase.from("orders").select("notes").eq("id", orderId).maybeSingle()).data as { notes: string | null } | null;
  const notes = upsertTaggedNote(freshNotes?.notes ?? order.notes, "[IADE]", `[IADE] issued | ${returnedScenario} | ${number} | ${ettn} | ${issuedAt.toISOString().slice(0, 10)}`);
  await saveInvoiceNote(orderId, notes, { invoice_status: "return_issued" });
}

/**
 * İade onaylanınca: e-Arşiv 7 gün içindeyse iptal edilir.
 * Süre dolduysa veya fatura e-Fatura ise iade faturası kesilir.
 */
export async function cancelInvoiceForRefundedOrder(orderId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("orders").select("id, notes").eq("id", orderId).maybeSingle();
  if (!data) return;
  const notes = (data as { notes: string | null }).notes || "";
  if (notes.includes("[IADE] issued")) return;
  if (notes.includes("[FATURA IPTAL] e-Arşiv iptal edildi")) return;
  const issued = parseIssuedInvoice(notes);
  if (!issued) return;
  const config = readConfig();
  if (!config) {
    await saveInvoiceNote(orderId, upsertTaggedNote(notes, "[IADE]", "[IADE] failed | Uyum ayarı eksik"));
    return;
  }

  let issueDate = issued.issueDate;
  if (!issueDate) {
    try {
      issueDate = await fetchOutboxIssueDate(config, issued.ettn);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await saveInvoiceNote(orderId, upsertTaggedNote(notes, "[IADE]", `[IADE] failed | ${message.slice(0, 180)}`));
      return;
    }
  }

  const eInvoice = issued.scenario.toLowerCase().includes("einvoice");
  if (!eInvoice && eArchiveCancelOpen(issueDate)) {
    try {
      const body =
        `<tem:CancelEArchiveInvoice>` +
        `<tem:userInfo Username="${xml(config.username)}" Password="${xml(config.password)}"/>` +
        `<tem:request InvoiceId="${xml(issued.ettn)}" CancelDate="${stamp()}"/>` +
        `</tem:CancelEArchiveInvoice>`;
      const response = await soap(config.endpoint, "CancelEArchiveInvoice", body);
      const result = response.match(/CancelEArchiveInvoiceResult\b[^>]*/)?.[0] || "";
      if (attr(result, "IsSucceded").toLowerCase() !== "true") {
        throw new Error(attr(result, "Message") || "e-Arşiv iptal reddedildi");
      }
      await saveInvoiceNote(orderId, upsertTaggedNote(notes, "[FATURA IPTAL]", "[FATURA IPTAL] e-Arşiv iptal edildi"), { invoice_status: "cancelled" });
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Uyum e-Arşiv iptal:", message);
      await saveInvoiceNote(orderId, upsertTaggedNote(notes, "[FATURA IPTAL]", `[FATURA IPTAL] başarısız | ${message.slice(0, 180)}`));
      return;
    }
  }

  try {
    await issueReturnInvoice(orderId, { number: issued.number, issueDate, scenario: issued.scenario });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Uyum iade faturası:", message);
    const { data: latest } = await supabase.from("orders").select("notes").eq("id", orderId).maybeSingle();
    await saveInvoiceNote(orderId, upsertTaggedNote((latest as { notes: string | null } | null)?.notes ?? notes, "[IADE]", `[IADE] failed | ${message.slice(0, 180)}`));
  }
}
