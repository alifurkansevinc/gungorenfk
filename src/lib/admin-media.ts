/** Admin görsel yükleme: klasör adları ve doğrulama. */

export const ADMIN_MEDIA_BUCKET = "admin-media";

export const ADMIN_MEDIA_FOLDERS = [
  "squad",
  "board",
  "technical",
  "store",
  "transfer",
  "news",
  "gallery",
  "trophy",
  "featured",
  "matches",
] as const;

export type AdminMediaFolder = (typeof ADMIN_MEDIA_FOLDERS)[number];

export const ADMIN_MEDIA_MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isAdminMediaFolder(v: string): v is AdminMediaFolder {
  return (ADMIN_MEDIA_FOLDERS as readonly string[]).includes(v);
}

export function extensionForMime(mime: string): string | null {
  return MIME_TO_EXT[mime.toLowerCase()] ?? null;
}

export function buildAdminMediaObjectPath(folder: AdminMediaFolder, mime: string): string | null {
  const ext = extensionForMime(mime);
  if (!ext) return null;
  const year = new Date().getUTCFullYear();
  const id = crypto.randomUUID();
  return `${folder}/${year}/${id}.${ext}`;
}

export function publicUrlForAdminMediaPath(supabaseUrl: string, path: string): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${ADMIN_MEDIA_BUCKET}/${encoded}`;
}
