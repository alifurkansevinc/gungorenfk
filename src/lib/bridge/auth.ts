import { timingSafeEqual } from "crypto";

/** Bridge API key: Authorization Bearer veya x-bridge-api-key. */
export function assertBridgeApiKey(request: Request): { ok: true } | { ok: false; status: number; error: string } {
  const expected = process.env.BRIDGE_API_KEY?.trim();
  if (!expected) {
    return { ok: false, status: 503, error: "Bridge yapılandırılmamış (BRIDGE_API_KEY)." };
  }

  const headerKey = request.headers.get("x-bridge-api-key")?.trim() ?? "";
  const auth = request.headers.get("authorization")?.trim() ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  const provided = headerKey || bearer;

  if (!provided || !safeEqual(provided, expected)) {
    return { ok: false, status: 401, error: "Yetkisiz." };
  }
  return { ok: true };
}

function safeEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
