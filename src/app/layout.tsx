import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: "400", display: "swap" });

const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Alex Said · A Case Study by Tehron Porter", template: "%s · Alex Said" },
  description: "A daily quote app for Alex Hormozi’s audience, designed and built by Tehron Porter for Acquisition.com.",
  applicationName: "Alex Said",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Alex Said" },
  formatDetection: { telephone: false },
  twitter: { card: "summary_large_image" }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0B0B",
  colorScheme: "dark"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
