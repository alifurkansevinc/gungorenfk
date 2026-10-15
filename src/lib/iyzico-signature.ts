import crypto from "crypto";

/**
 * Checkout Form / HPP webhook imzası (X-IYZ-SIGNATURE-V3).
 * message = secretKey + iyziEventType + iyziPaymentId + token + paymentConversationId + status
 * @see https://docs.iyzico.com/ek-servisler/webhook
 */
export function iyzicoHppSignature(params: {
  secretKey: string;
  iyziEventType: string;
  iyziPaymentId: string;
  token: string;
  paymentConversationId: string;
  status: string;
}): string {
  const message =
    params.secretKey +
    params.iyziEventType +
    params.iyziPaymentId +
    params.token +
    params.paymentConversationId +
    params.status;
  return crypto.createHmac("sha256", params.secretKey).update(message, "utf8").digest("hex");
}

export function verifyIyzicoHppSignature(
  params: {
    secretKey: string;
    iyziEventType: string;
    iyziPaymentId: string;
    token: string;
    paymentConversationId: string;
    status: string;
  },
  headerSignature: string
): boolean {
  const expected = iyzicoHppSignature(params);
  const received = headerSignature.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(received) || received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
}
