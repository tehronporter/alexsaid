import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";
import { isLeilaProduct } from "@/lib/product";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticPaths = ["", ...(isLeilaProduct ? [] : ["/app"]), "/discover", "/saved", "/settings", "/install", "/more", "/privacy", "/terms", "/disclaimer"];

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(catalog.generatedAt) })),
    ...catalog.quotes.map((quote) => ({ url: `${base}/q/${quote.id}`, lastModified: new Date(quote.updatedAt) })),
    ...catalog.collections.map((collection) => ({ url: `${base}/collections/${collection.slug}`, lastModified: new Date(catalog.generatedAt) })),
  ];
}
