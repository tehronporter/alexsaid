"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { BrandConfig } from "@/domain/product";

const AppExperience = dynamic(() => import("@/components/app-experience"));

export function ProductRoot({ brand, children }: { brand: BrandConfig; children: React.ReactNode }) {
  const pathname = usePathname();

  if (brand.id === "alex" && pathname === "/") return <>{children}</>;

  return <AppExperience brand={brand}>{children}</AppExperience>;
}
