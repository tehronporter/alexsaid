"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SurfaceMode } from "@/components/app-shell";
import { BrandMark } from "@/components/brand-mark";
import { ProductIcon } from "@/components/product-icon";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Quote", icon: "quote", matches: (path: string) => path === "/" || path.startsWith("/q/") || path.startsWith("/source/") },
  { href: "/discover", label: "Discover", icon: "discover", matches: (path: string) => path.startsWith("/discover") || path.startsWith("/collections/") },
  { href: "/saved", label: "Saved", icon: "save", matches: (path: string) => path.startsWith("/saved") },
  { href: "/more", label: "More", icon: "more", matches: (path: string) => path.startsWith("/more") || path.startsWith("/settings") || path.startsWith("/install") || path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/disclaimer") },
] as const;

function NavItem({ item, mobile = false }: { item: (typeof items)[number]; mobile?: boolean }) {
  const pathname = usePathname();
  const active = item.matches(pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center transition-colors duration-150",
        mobile
          ? cn("min-w-0 flex-1 flex-col justify-center gap-1 px-1 py-2 text-[0.65rem]", active ? "text-white" : "text-white/65 hover:text-white/85")
          : cn("min-h-14 flex-col justify-center gap-1.5 border-l-2 px-1 py-2 text-[0.65rem] font-semibold tracking-wide", active ? "border-[var(--purple-light)] text-white" : "border-transparent text-white/48 hover:text-white"),
      )}
    >
      {mobile && active ? <span className="absolute left-1/2 -top-1 h-0.5 w-7 -translate-x-1/2 bg-[var(--purple-light)]" aria-hidden="true" /> : null}
      <ProductIcon name={item.icon} className="size-5" />
      <span className={mobile ? "truncate" : undefined}>{item.label}</span>
    </Link>
  );
}

export function DesktopNavigation({ surfaceMode }: { surfaceMode: SurfaceMode }) {
  return (
    <aside data-nav-surface={surfaceMode} className="app-rail fixed inset-y-0 left-0 z-40 hidden w-20 flex-col border-r border-white/12 bg-[var(--near-black)] px-2 py-6 lg:flex">
      <BrandMark compact className="mb-10 justify-center" />
      <nav className="flex flex-1 flex-col gap-2" aria-label="Primary navigation">
        {items.map((item) => <NavItem key={item.href} item={item} />)}
      </nav>
    </aside>
  );
}

export function MobileNavigation({ surfaceMode }: { surfaceMode: SurfaceMode }) {
  return (
    <nav data-nav-surface={surfaceMode} className="fixed inset-x-0 bottom-0 z-50 flex min-h-[var(--tab-bar-height)] border-t border-white/12 bg-[rgb(8_8_8/0.96)] px-2 pt-1 backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }} aria-label="Primary navigation">
      {items.map((item) => <NavItem key={item.href} item={item} mobile />)}
    </nav>
  );
}
