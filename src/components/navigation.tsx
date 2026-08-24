"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Home, MoreHorizontal } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Quote", icon: Home, matches: (path: string) => path === "/" || path.startsWith("/q/") || path.startsWith("/source/") },
  { href: "/discover", label: "Discover", icon: Compass, matches: (path: string) => path.startsWith("/discover") || path.startsWith("/collections/") },
  { href: "/saved", label: "Saved", icon: Bookmark, matches: (path: string) => path.startsWith("/saved") },
  { href: "/more", label: "More", icon: MoreHorizontal, matches: (path: string) => path.startsWith("/more") || path.startsWith("/settings") || path.startsWith("/install") || path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/disclaimer") }
];

function NavItem({ item, mobile = false }: { item: (typeof items)[number]; mobile?: boolean }) {
  const pathname = usePathname();
  const active = item.matches(pathname);
  const Icon = item.icon;
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={cn(
      "group flex items-center rounded-2xl transition-all active:scale-95",
      mobile
        ? cn("min-w-0 flex-1 flex-col justify-center gap-1 px-1 py-2 text-[0.65rem]", active ? "text-white" : "text-white/55")
        : cn(
            "flex-col justify-center gap-1.5 px-2 py-3 text-[0.7rem] font-semibold tracking-wide",
            active ? "bg-white text-black" : "text-white/60 hover:bg-white/10 hover:text-white"
          )
    )}>
      <Icon className={mobile ? "size-5" : "size-5"} strokeWidth={active ? 2.4 : 1.8} />
      <span className={mobile ? "truncate" : undefined}>{item.label}</span>
    </Link>
  );
}

export function DesktopNavigation() {
  return (
    <aside className="rail-glass fixed inset-y-0 left-0 z-40 hidden w-24 flex-col border-r border-white/10 px-2.5 py-6 lg:flex">
      <BrandMark compact className="mb-9 justify-center" />
      <nav className="flex flex-1 flex-col gap-1.5" aria-label="Primary navigation">
        {items.map((item) => <NavItem key={item.href} item={item} />)}
      </nav>
    </aside>
  );
}

export function MobileNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-white/10 bg-black/95 px-2 pt-1 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }} aria-label="Primary navigation">
      {items.map((item) => <NavItem key={item.href} item={item} mobile />)}
    </nav>
  );
}
