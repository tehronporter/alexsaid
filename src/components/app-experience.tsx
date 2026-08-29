"use client";

import { AppProviders } from "@/components/app-providers";
import { AppShell } from "@/components/app-shell";
import type { BrandConfig } from "@/domain/product";

export default function AppExperience({ brand, children }: { brand: BrandConfig; children: React.ReactNode }) {
  return (
    <AppProviders brand={brand}>
      <AppShell>{children}</AppShell>
    </AppProviders>
  );
}
