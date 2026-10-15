import type { NextRequest } from "next/server";
import { getSiteUrl } from "./site-url";

function isLocalHost(host: string): boolean {
  const name = host.split(":")[0]?.toLowerCase() ?? "";
  return name === "localhost" || name === "127.0.0.1" || name === "[::1]";
}

/**
 * Ödeme callback adresi, müşterinin açtığı siteyle aynı host olmalı.
 * Eski/yanlış NEXT_PUBLIC_BASE_URL, iyzico dönüşünü başka bir domaine yollayıp
 * siparişi PENDING bırakabiliyor.
 */
export function resolvePublicBaseUrl(input: {
  host?: string | null;
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  siteUrl: string;
}): string {
  const forwarded = input.forwardedHost?.split(",")[0]?.trim() ?? "";
  const host = forwarded || input.host?.split(",")[0]?.trim() || "";
  const siteUrl = input.siteUrl.replace(/\/+$/, "");
  if (!host || isLocalHost(host)) {
    if (siteUrl && !isLocalHost(siteUrl.replace(/^https?:\/\//, ""))) return siteUrl;
    if (host) {
      const proto = isLocalHost(host) ? "http" : "https";
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
    return siteUrl || "http://localhost:3000";
  }
  const proto = input.forwardedProto?.split(",")[0]?.trim() || "https";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

export function publicBaseUrl(req: NextRequest): string {
  return resolvePublicBaseUrl({
    host: req.headers.get("host"),
    forwardedHost: req.headers.get("x-forwarded-host"),
    forwardedProto: req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", ""),
    siteUrl: getSiteUrl(),
  });
}
