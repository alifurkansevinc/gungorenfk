import { NextRequest, NextResponse } from "next/server";
import { applyCheckoutToken } from "@/lib/checkout-settlement";
import { isCheckoutToken } from "@/lib/iyzico-result";
import { verifyIyzicoHppSignature } from "@/lib/iyzico-signature";

type WebhookBody = {
  paymentConversationId?: string | number | null;
  status?: string | null;
  token?: string | null;
  iyziEventType?: string | null;
  iyziPaymentId?: string | number | null;
  paymentId?: string | number | null;
};

const HANDLED_EVENTS = new Set([
  "CHECKOUT_FORM_AUTH",
  "CREDIT_PAYMENT_AUTH",
  "CREDIT_PAYMENT_PENDING",
  "CREDIT_PAYMENT_INIT",
]);

/**
 * iyzico işyeri bildirimi. Tarayıcı callback'i kaçsa bile ödenen siparişi kapatır.
 * Panel: Ayarlar → Firma Ayarları → İşyeri Bildirimleri → https://SITE/api/iyzico/webhook
 */
export async function POST(req: NextRequest) {
  let body: WebhookBody;
  try {
    body = (await req.json()) as WebhookBody;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const event = body.iyziEventType ?? "";
  const status = (body.status ?? "").toUpperCase();
  if (!token || !isCheckoutToken(token) || !HANDLED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const secretKey = process.env.IYZICO_SECRET_KEY;
  const signature = req.headers.get("x-iyz-signature-v3");
  if (signature) {
    if (!secretKey) return NextResponse.json({ ok: false, error: "secret_missing" }, { status: 500 });
    const valid = verifyIyzicoHppSignature(
      {
        secretKey,
        iyziEventType: event,
        iyziPaymentId: String(body.iyziPaymentId ?? body.paymentId ?? ""),
        token,
        paymentConversationId: body.paymentConversationId == null ? "" : String(body.paymentConversationId),
        status: body.status ?? "",
      },
      signature
    );
    if (!valid) return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  if (status !== "SUCCESS" && status !== "FAILURE") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  try {
    const result = await applyCheckoutToken(token, { markFailure: status === "FAILURE" });
    return NextResponse.json({ ok: true, outcome: result.outcome });
  } catch (err) {
    console.error("iyzico webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
