/**
 * Kanonik site kökü: sitemap, robots, metadataBase ve OG URL'leri için.
 * Production'da mutlaka `NEXT_PUBLIC_SITE_URL` (veya `NEXT_PUBLIC_BASE_URL`) tanımlayın.
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}
