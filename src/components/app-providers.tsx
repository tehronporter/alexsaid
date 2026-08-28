"use client";

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { UserStateProvider } from "@/components/user-state-provider";
import { CatalogProvider } from "@/components/catalog-provider";
import { BrandProvider } from "@/components/brand-provider";
import type { BrandConfig } from "@/domain/product";

export function AppProviders({ brand, children }: { brand: BrandConfig; children: React.ReactNode }) {
  return (
    <BrandProvider brand={brand}>
      <CatalogProvider>
        <UserStateProvider storageKey={brand.storageKey}>
          {children}
          <ServiceWorkerRegistrar productID={brand.id} homePath={brand.homePath} />
          <Toaster position="top-center" theme="dark" />
        </UserStateProvider>
      </CatalogProvider>
    </BrandProvider>
  );
}
