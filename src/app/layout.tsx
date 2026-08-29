import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { ProductRoot } from "@/components/product-root";
import { activeBrand, isLeilaProduct } from "@/lib/product";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: "400", display: "swap" });

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: isLeilaProduct ? activeBrand.productName : "Alex Said · A Case Study by Tehron Porter",
      template: `%s · ${activeBrand.productName}`
    },
    description: activeBrand.applicationDescription,
    applicationName: activeBrand.productName,
    manifest: "/manifest.webmanifest",
    icons: { icon: activeBrand.icon, apple: activeBrand.appleIcon },
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: activeBrand.productName },
    formatDetection: { telephone: false },
    twitter: { card: "summary_large_image" }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: isLeilaProduct ? activeBrand.colors.quoteBackground : "#0B0B0B",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const productStyle = {
    "--purple": activeBrand.colors.primary,
    "--purple-light": activeBrand.colors.primaryLight,
    "--muted-purple": activeBrand.colors.mutedPrimary,
    "--quote-bg": activeBrand.colors.quoteBackground,
    "--quote-fg": activeBrand.colors.quoteForeground,
    "--quote-muted": activeBrand.colors.quoteMuted,
    "--quote-subtle": activeBrand.colors.quoteSubtle,
    "--quote-rule": activeBrand.colors.quoteRule
  } as CSSProperties;
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased" data-product={activeBrand.id} style={productStyle}>
        <ProductRoot brand={activeBrand}>{children}</ProductRoot>
        {process.env.VERCEL ? <Analytics /> : null}
        {process.env.VERCEL ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
