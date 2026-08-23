"use client";

import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";
import { UserStateProvider } from "@/components/user-state-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <UserStateProvider>{children}<ServiceWorkerRegistrar /><Toaster position="top-center" theme="dark" /></UserStateProvider>;
}
