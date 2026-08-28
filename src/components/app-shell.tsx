"use client";

import { usePathname } from "next/navigation";
import { DesktopNavigation, MobileNavigation } from "@/components/navigation";
import { useBrand } from "@/components/brand-provider";

export type SurfaceMode = "quote" | "library";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const brand = useBrand();
  if (pathname === "/" && brand.id === "alex") return <>{children}</>;
  const surfaceMode: SurfaceMode = pathname === brand.homePath || pathname.startsWith("/q/") ? "quote" : "library";
  return <div data-surface={surfaceMode} className="min-h-dvh"><DesktopNavigation surfaceMode={surfaceMode} />{children}<MobileNavigation surfaceMode={surfaceMode} /></div>;
}
