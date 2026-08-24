"use client";

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { UserStateProvider } from "@/components/user-state-provider";
import { CatalogProvider } from "@/components/catalog-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CatalogProvider><UserStateProvider>{children}<ServiceWorkerRegistrar /><Toaster position="top-center" theme="dark" /></UserStateProvider></CatalogProvider>;
}
