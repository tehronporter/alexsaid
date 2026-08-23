import { pushPayloadSchema, type PushPayload, type Quote } from "@/domain/catalog";

export const pushEnabled = process.env.NEXT_PUBLIC_PUSH_ENABLED === "true";

export function makePushPayload(quote: Quote): PushPayload {
  return pushPayloadSchema.parse({
    version: 1,
    quoteID: quote.id,
    title: "Hormozi Said",
    body: quote.shortVersion ?? quote.text,
    url: `/q/${quote.id}`,
    icon: "/icons/icon-192.png"
  });
}
