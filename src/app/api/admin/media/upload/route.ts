import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import {
  ADMIN_MEDIA_BUCKET,
  ADMIN_MEDIA_MAX_BYTES,
  buildAdminMediaObjectPath,
  extensionForMime,
  isAdminMediaFolder,
  publicUrlForAdminMediaPath,
} from "@/lib/admin-media";

export const runtime = "nodejs";

async function requireAdmin() {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Oturum gerekli." };
  const { checkIsAdmin, hasValidBypass } = await import("@/app/admin/actions");
  const hasBypass = await hasValidBypass();
  const { isAdmin } = await checkIsAdmin(user.id);
  if (!isAdmin && !hasBypass) return { ok: false as const, status: 403, error: "Yetkisiz." };
  return { ok: true as const };
}

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: "Geçersiz istek." }, { status: 400 });
  }

  const folderRaw = String(formData.get("folder") ?? "").trim();
  if (!isAdminMediaFolder(folderRaw)) {
    return NextResponse.json({ success: false, error: "Geçersiz klasör." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ success: false, error: "Dosya seçilmedi." }, { status: 400 });
  }

  if (file.size > ADMIN_MEDIA_MAX_BYTES) {
    return NextResponse.json(
      { success: false, error: `Dosya en fazla ${ADMIN_MEDIA_MAX_BYTES / (1024 * 1024)} MB olabilir.` },
      { status: 400 },
    );
  }

  const mime = (file.type || "").toLowerCase();
  if (!extensionForMime(mime)) {
    return NextResponse.json(
      { success: false, error: "Yalnızca JPEG, PNG, WebP veya GIF yüklenebilir." },
      { status: 400 },
    );
  }

  const objectPath = buildAdminMediaObjectPath(folderRaw, mime);
  if (!objectPath) {
    return NextResponse.json({ success: false, error: "Dosya yolu oluşturulamadı." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ success: false, error: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  try {
    const svc = createServiceRoleClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await svc.storage.from(ADMIN_MEDIA_BUCKET).upload(objectPath, buffer, {
      contentType: mime,
      upsert: false,
      cacheControl: "31536000",
    });
    if (upErr) {
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }
    const url = publicUrlForAdminMediaPath(supabaseUrl, objectPath);
    return NextResponse.json({ success: true, url, path: objectPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return NextResponse.json({ success: false, error: "SUPABASE_SERVICE_ROLE_KEY tanımlı değil." }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
