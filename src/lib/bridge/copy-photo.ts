import {
  ADMIN_MEDIA_BUCKET,
  ADMIN_MEDIA_MAX_BYTES,
  buildAdminMediaObjectPath,
  extensionForMime,
  publicUrlForAdminMediaPath,
} from "@/lib/admin-media";
import { createServiceRoleClient } from "@/lib/supabase/service";

function sniffMime(buf: Buffer, contentType: string | null): string | null {
  const ct = (contentType || "").split(";")[0].trim().toLowerCase();
  if (extensionForMime(ct)) return ct;
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "image/png";
  }
  if (buf.length >= 6 && buf.slice(0, 6).toString("ascii") === "GIF87a") return "image/gif";
  if (buf.length >= 6 && buf.slice(0, 6).toString("ascii") === "GIF89a") return "image/gif";
  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString("ascii") === "RIFF" &&
    buf.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Uzak foto URL'sini indirip admin-media/squad altına kopyalar.
 * Public URL döner; başarısızsa hata fırlatır.
 */
export async function copyRemotePhotoToSquadStorage(remoteUrl: string): Promise<string> {
  const url = remoteUrl.trim();
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("Geçersiz foto URL.");
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Geçersiz foto URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Desteklenmeyen protokol.");
  }

  const res = await fetch(url, {
    redirect: "follow",
    headers: { Accept: "image/*,*/*" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    throw new Error(`Foto indirilemedi (${res.status}).`);
  }

  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length === 0) throw new Error("Boş dosya.");
  if (buf.length > ADMIN_MEDIA_MAX_BYTES) {
    throw new Error(`Dosya en fazla ${ADMIN_MEDIA_MAX_BYTES / (1024 * 1024)} MB olabilir.`);
  }

  const mime = sniffMime(buf, res.headers.get("content-type"));
  if (!mime || !extensionForMime(mime)) {
    throw new Error("Desteklenmeyen görsel formatı.");
  }

  const objectPath = buildAdminMediaObjectPath("squad", mime);
  if (!objectPath) throw new Error("Dosya yolu oluşturulamadı.");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL eksik.");

  const svc = createServiceRoleClient();
  const { error: upErr } = await svc.storage.from(ADMIN_MEDIA_BUCKET).upload(objectPath, buf, {
    contentType: mime,
    upsert: false,
    cacheControl: "31536000",
  });
  if (upErr) throw new Error(upErr.message);

  return publicUrlForAdminMediaPath(supabaseUrl, objectPath);
}
