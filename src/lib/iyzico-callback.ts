import { NextRequest, NextResponse } from "next/server";
import { applyCheckoutToken } from "@/lib/checkout-settlement";
import { isCheckoutToken } from "@/lib/iyzico-result";
import { publicBaseUrl } from "@/lib/public-base-url";

export async function readCheckoutToken(req: NextRequest): Promise<string | null> {
  const fromQuery = req.nextUrl.searchParams.get("token")?.trim();
  if (fromQuery) return fromQuery;
  if (req.method === "GET" || req.method === "HEAD") return null;

  const raw = await req.text();
  if (!raw.trim()) return null;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json") || raw.trim().startsWith("{")) {
    try {
      const json = JSON.parse(raw) as { token?: unknown };
      if (typeof json.token === "string" && json.token.trim()) return json.token.trim();
    } catch {
      /* form gövdesi */
    }
  }
  return new URLSearchParams(raw).get("token")?.trim() || null;
}

/** iyzico tarayıcı dönüşü. 303, POST'un başarı sayfasına taşınmasını engeller. */
export async function checkoutCallbackResponse(req: NextRequest, errorBase: string, notFoundCode: string): Promise<NextResponse> {
  const base = publicBaseUrl(req);
  try {
    const token = await readCheckoutToken(req);
    if (!token || !isCheckoutToken(token)) {
      return NextResponse.redirect(new URL(`${errorBase}?error=token_missing`, base), 303);
    }
    const result = await applyCheckoutToken(token);
    const path = result.redirectPath ?? `${errorBase}?error=${encodeURIComponent(notFoundCode)}`;
    return NextResponse.redirect(new URL(path, base), 303);
  } catch (err) {
    console.error("Checkout callback error:", err);
    const message = err instanceof Error ? err.message : "Bir hata oluştu";
    return NextResponse.redirect(new URL(`${errorBase}?error=${encodeURIComponent(message)}`, base), 303);
  }
}
