import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const staticPaths = ["", "/discover", "/install", "/more", "/privacy", "/terms", "/disclaimer"];

  return [
    ...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(catalog.generatedAt) })),
    ...catalog.quotes.map((quote) => ({ url: `${base}/q/${quote.id}`, lastModified: new Date(quote.updatedAt) })),
  ];
}
