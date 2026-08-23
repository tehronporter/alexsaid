import { DesktopNavigation, MobileNavigation } from "@/components/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <><DesktopNavigation />{children}<MobileNavigation /></>;
}
