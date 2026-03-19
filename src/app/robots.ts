import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/auth/",
        "/benim-kosem/",
        "/odeme",
        "/sepet",
        "/taraftar/kayit/complete",
      ],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
