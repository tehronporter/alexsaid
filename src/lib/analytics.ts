"use client";

import { track } from "@vercel/analytics";

export type ProductEvent =
  | "quote_viewed"
  | "quote_saved"
  | "quote_unsaved"
  | "quote_shared"
  | "source_opened"
  | "search_performed"
  | "topic_opened"
  | "install_viewed"
  | "pwa_installed"
  | "notification_interest";

type SafeProperties = Record<string, string | number | boolean | null>;

export function trackProductEvent(event: ProductEvent, properties: SafeProperties = {}) {
  track(event, properties);
}
