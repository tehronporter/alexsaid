"use client";

import { usePathname } from "next/navigation";
import { DesktopNavigation, MobileNavigation } from "@/components/navigation";

export type SurfaceMode = "quote" | "library";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  const surfaceMode: SurfaceMode = pathname === "/app" || pathname.startsWith("/q/") ? "quote" : "library";
  return <div data-surface={surfaceMode} className="min-h-dvh"><DesktopNavigation surfaceMode={surfaceMode} />{children}<MobileNavigation surfaceMode={surfaceMode} /></div>;
}
