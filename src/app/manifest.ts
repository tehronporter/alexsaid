import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Alex Said",
    short_name: "Alex Said",
    description: "Business advice worth remembering, one quote at a time.",
    start_url: "/app",
    display: "standalone",
    background_color: "#0B0B0B",
    theme_color: "#6B2CFF",
    orientation: "portrait-primary",
    categories: ["business", "education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icons/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ]
  };
}
