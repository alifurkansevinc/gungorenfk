import Link from "next/link";
import { getAdminSupabase } from "../../actions";
import { FEATURED_MODULE_OPTIONS, getModuleByKey } from "@/lib/featured-modules";
import { OneCikanForm } from "./OneCikanForm";
import { OneCikanRow } from "./OneCikanRow";

const FEATURED_MAX = 5;

export default async function AdminOneCikanPage() {
  const supabase = await getAdminSupabase();
  const { data: items } = await supabase
    .from("homepage_featured")
    .select("id, module_key, title, subtitle, image_url, link, is_large, sort_order")
    .order("sort_order", { ascending: true });

  const usedKeys = new Set((items ?? []).map((i) => i.module_key));
  const availableModules = FEATURED_MODULE_OPTIONS.filter((m) => !usedKeys.has(m.key));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Öne Çıkan</h1>
          <p className="mt-1 text-siyah/70">Anasayfadaki öne çıkan modüller (en fazla {FEATURED_MAX}). Sıra ve görselleri buradan yönetin.</p>
        </div>
        <Link href="/" target="_blank" className="text-sm text-bordo hover:underline">Anasayfayı görüntüle</Link>
      </div>

      {(items?.length ?? 0) < FEATURED_MAX && (
        <OneCikanForm availableModules={availableModules} />
      )}

      <div className="mt-6 space-y-2">
        {(!items || items.length === 0) ? (
          <p className="rounded-lg border border-dashed border-siyah/20 bg-beyaz p-6 text-center text-siyah/60">Henüz öne çıkan modül yok. Yukarıdan ekleyin (en fazla {FEATURED_MAX}).</p>
        ) : (
          items.map((item, index) => {
            const def = getModuleByKey(item.module_key);
            return (
              <OneCikanRow
                key={item.id}
                item={item}
                index={index}
                total={items.length}
                defaultTitle={def?.defaultTitle}
                defaultSubtitle={def?.defaultSubtitle}
                defaultLink={def?.link}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
