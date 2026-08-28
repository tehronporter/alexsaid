import { z } from "zod";

export const productIDSchema = z.enum(["alex", "leila"]);

export type ProductID = z.infer<typeof productIDSchema>;

export interface BrandConfig {
  id: ProductID;
  productName: string;
  authorName: "Alex Hormozi" | "Leila Hormozi";
  homePath: "/" | "/app";
  catalogPath: "/catalog.v3.json";
  storageKey: string;
  exportFileName: string;
  description: string;
  applicationDescription: string;
  icon: string;
  appleIcon: string;
  maskableIcon: string;
  colors: {
    primary: string;
    primaryLight: string;
    mutedPrimary: string;
    quoteBackground: string;
    quoteForeground: string;
    quoteMuted: string;
    quoteSubtle: string;
    quoteRule: string;
    shareBackground: string;
    shareForeground: string;
  };
}

export const brands = {
  alex: {
    id: "alex",
    productName: "Alex Said",
    authorName: "Alex Hormozi",
    homePath: "/app",
    catalogPath: "/catalog.v3.json",
    storageKey: "hormozi-said:user-state:v1",
    exportFileName: "hormozi-said-data.json",
    description: "Business advice worth remembering, one quote at a time.",
    applicationDescription: "A daily quote app for Alex Hormozi’s audience, designed and built by Tehron Porter for Acquisition.com.",
    icon: "/icons/icon.svg",
    appleIcon: "/icons/icon-192.png",
    maskableIcon: "/icons/icon-maskable.svg",
    colors: {
      primary: "#6B2CFF",
      primaryLight: "#9D6CFF",
      mutedPrimary: "#D6C7FF",
      quoteBackground: "#6B2CFF",
      quoteForeground: "#FFFFFF",
      quoteMuted: "rgb(255 255 255 / 85%)",
      quoteSubtle: "rgb(255 255 255 / 60%)",
      quoteRule: "rgb(255 255 255 / 40%)",
      shareBackground: "linear-gradient(160deg, #9D6CFF 0%, #6B2CFF 45%, #35108F 100%)",
      shareForeground: "#FFFFFF"
    }
  },
  leila: {
    id: "leila",
    productName: "Leila Said",
    authorName: "Leila Hormozi",
    homePath: "/",
    catalogPath: "/catalog.v3.json",
    storageKey: "leila-said:user-state:v1",
    exportFileName: "leila-said-data.json",
    description: "Leadership and operating advice worth remembering, one quote at a time.",
    applicationDescription: "A daily quote app for Leila Hormozi’s audience, designed and built by Tehron Porter as an independent Acquisition.com concept.",
    icon: "/icons/leila/icon.svg",
    appleIcon: "/icons/leila/icon-192.png",
    maskableIcon: "/icons/leila/icon-maskable.svg",
    colors: {
      primary: "#6B2CFF",
      primaryLight: "#9D6CFF",
      mutedPrimary: "#D6C7FF",
      quoteBackground: "#FFFFFF",
      quoteForeground: "#6B2CFF",
      quoteMuted: "rgb(107 44 255 / 82%)",
      quoteSubtle: "rgb(107 44 255 / 58%)",
      quoteRule: "rgb(107 44 255 / 42%)",
      shareBackground: "#FFFFFF",
      shareForeground: "#6B2CFF"
    }
  }
} as const satisfies Record<ProductID, BrandConfig>;

export function getBrandConfig(productID: ProductID): BrandConfig {
  return brands[productID];
}
