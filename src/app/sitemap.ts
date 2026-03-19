import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { createPublicSupabaseClient } from "@/lib/supabase/public-anon";

type Change = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const STATIC: { path: string; changeFrequency: Change; priority: number }[] = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/haberler", changeFrequency: "daily", priority: 0.9 },
  { path: "/maclar", changeFrequency: "daily", priority: 0.9 },
  { path: "/kadro", changeFrequency: "weekly", priority: 0.85 },
  { path: "/transferler", changeFrequency: "weekly", priority: 0.8 },
  { path: "/kulup", changeFrequency: "monthly", priority: 0.85 },
  { path: "/kulup/yonetim-kurulu", changeFrequency: "monthly", priority: 0.7 },
  { path: "/kulup/teknik-heyet", changeFrequency: "monthly", priority: 0.7 },
  { path: "/magaza", changeFrequency: "daily", priority: 0.9 },
  { path: "/galeri", changeFrequency: "weekly", priority: 0.8 },
  { path: "/biletler", changeFrequency: "weekly", priority: 0.85 },
  { path: "/bagis", changeFrequency: "monthly", priority: 0.75 },
  { path: "/taraftar", changeFrequency: "monthly", priority: 0.8 },
  { path: "/taraftar/giris", changeFrequency: "monthly", priority: 0.5 },
  { path: "/taraftar/kayit", changeFrequency: "monthly", priority: 0.5 },
  { path: "/mesafeli-satis-sozlesmesi", changeFrequency: "yearly", priority: 0.3 },
  { path: "/gizlilik-sozlesmesi", changeFrequency: "yearly", priority: 0.3 },
];

function absoluteUrl(base: string, path: string): string {
  if (path === "") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC.map(({ path, changeFrequency, priority }) => ({
    url: absoluteUrl(base, path),
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const supabase = createPublicSupabaseClient();
  if (!supabase) return entries;

  const [newsRes, matchesRes, galleriesRes, productsRes] = await Promise.all([
    supabase
      .from("news")
      .select("slug, updated_at")
      .or("published_at.not.is.null,event_date.not.is.null")
      .or("is_hidden.eq.false,is_hidden.is.null"),
    supabase
      .from("matches")
      .select("id, updated_at")
      .or("is_hidden.eq.false,is_hidden.is.null"),
    supabase.from("galleries").select("slug, created_at"),
    supabase.from("store_products").select("slug, updated_at").eq("is_active", true),
  ]);

  for (const row of newsRes.data ?? []) {
    const slug = (row as { slug?: string }).slug;
    if (!slug) continue;
    entries.push({
      url: absoluteUrl(base, `/haberler/${slug}`),
      lastModified: (row as { updated_at?: string }).updated_at
        ? new Date((row as { updated_at: string }).updated_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }

  for (const row of matchesRes.data ?? []) {
    const id = (row as { id?: string }).id;
    if (!id) continue;
    entries.push({
      url: absoluteUrl(base, `/maclar/${id}`),
      lastModified: (row as { updated_at?: string }).updated_at
        ? new Date((row as { updated_at: string }).updated_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const row of galleriesRes.data ?? []) {
    const slug = (row as { slug?: string }).slug;
    if (!slug) continue;
    entries.push({
      url: absoluteUrl(base, `/galeri/${slug}`),
      lastModified: (row as { created_at?: string }).created_at
        ? new Date((row as { created_at: string }).created_at)
        : undefined,
      changeFrequency: "monthly",
      priority: 0.55,
    });
  }

  for (const row of productsRes.data ?? []) {
    const slug = (row as { slug?: string }).slug;
    if (!slug) continue;
    entries.push({
      url: absoluteUrl(base, `/magaza/${slug}`),
      lastModified: (row as { updated_at?: string }).updated_at
        ? new Date((row as { updated_at: string }).updated_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  return entries;
}
