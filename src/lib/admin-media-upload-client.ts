import type { AdminMediaFolder } from "@/lib/admin-media";

export async function uploadAdminMediaFile(
  file: File,
  folder: AdminMediaFolder,
): Promise<{ url: string } | { error: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/media/upload", { method: "POST", body: fd, credentials: "include" });
  let json: { success?: boolean; url?: string; error?: string };
  try {
    json = await res.json();
  } catch {
    return { error: "Sunucu yanıtı okunamadı." };
  }
  if (!res.ok || !json.success || !json.url) {
    return { error: json.error ?? "Yükleme başarısız." };
  }
  return { url: json.url };
}
