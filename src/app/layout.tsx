import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], variable: "--font-bebas", weight: "400", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "Hormozi Said", template: "%s · Hormozi Said" },
  description: "Business advice worth remembering, one verified quote at a time.",
  applicationName: "Hormozi Said",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon-192.png" },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Hormozi Said" },
  formatDetection: { telephone: false }
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
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
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
