import type { MetadataRoute } from "next";
import { catalog } from "@/lib/catalog";
export default function sitemap(): MetadataRoute.Sitemap { const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"; const staticPaths = ["", "/discover", "/install", "/more", "/privacy", "/terms", "/disclaimer"]; return [...staticPaths.map((path) => ({ url: `${base}${path}`, lastModified: new Date(catalog.generatedAt) })), ...catalog.quotes.map((quote) => ({ url: `${base}/q/${quote.id}`, lastModified: new Date(quote.updatedAt) }))]; }
