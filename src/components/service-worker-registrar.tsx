"use client";

import { useEffect } from "react";
import type { ProductID } from "@/domain/product";

export function ServiceWorkerRegistrar({ productID, homePath }: { productID: ProductID; homePath: string }) {
  useEffect(() => {
    if ((process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SW_ENABLED === "true") && "serviceWorker" in navigator) {
      const params = new URLSearchParams({ product: productID, home: homePath });
      navigator.serviceWorker.register(`/sw.js?${params}`, { scope: "/", updateViaCache: "none" }).catch(() => undefined);
    }
  }, [homePath, productID]);
  return null;
}
