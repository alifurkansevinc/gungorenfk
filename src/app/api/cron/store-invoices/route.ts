import { NextResponse } from "next/server";
import { issueInvoiceForOrderNumber, probeUyumConnection, retryRecentStoreInvoices } from "@/lib/uyum-invoice";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const urlSecret = new URL(request.url).searchParams.get("secret");
  return urlSecret === secret;
}

/** Ödemesi 4 günü dolduran mağaza siparişlerinin faturasını keser. */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const url = new URL(request.url);
  if (url.searchParams.get("probe") === "1") {
    const probe = await probeUyumConnection();
    return NextResponse.json(probe, { status: probe.ok ? 200 : 502 });
  }
  const orderNumber = url.searchParams.get("order")?.trim();
  if (orderNumber) {
    const result = await issueInvoiceForOrderNumber(orderNumber, { force: url.searchParams.get("force") === "1" });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  try {
    const invoiced = await retryRecentStoreInvoices();
    return NextResponse.json({ ok: true, invoiced });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
