import type { MetadataRoute } from "next";
import { activeBrand } from "@/lib/product";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: activeBrand.homePath,
    name: activeBrand.productName,
    short_name: activeBrand.productName,
    description: activeBrand.description,
    start_url: activeBrand.homePath,
    display: "standalone",
    background_color: "#0B0B0B",
    theme_color: activeBrand.colors.quoteBackground,
    orientation: "portrait-primary",
    categories: ["business", "education", "productivity"],
    icons: [
      { src: activeBrand.appleIcon, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: activeBrand.icon, sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: activeBrand.maskableIcon, sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
