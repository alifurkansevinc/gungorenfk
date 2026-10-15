export type CheckoutInterpretation = "paid" | "failed" | "pending" | "query_error";

const CHECKOUT_TOKEN_RE = /^[A-Za-z0-9._~-]{8,200}$/;

export function isCheckoutToken(value: string): boolean {
  return CHECKOUT_TOKEN_RE.test(value);
}

/** iyzico CF sorgusunun siparişe etkisini belirler. Sorgu hatası ödeme başarısızlığı değildir. */
export function interpretCheckoutResult(result: {
  status?: string;
  paymentStatus?: string;
}): CheckoutInterpretation {
  const status = (result.status ?? "").toLowerCase();
  const paymentStatus = (result.paymentStatus ?? "").toUpperCase();
  if (status === "success" && paymentStatus === "SUCCESS") return "paid";
  if (status === "success" && paymentStatus === "FAILURE") return "failed";
  if (status === "success") return "pending";
  return "query_error";
}
