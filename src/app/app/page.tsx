import type { Metadata } from "next";
import { QuoteFeed } from "@/components/quote-feed";
import { catalog } from "@/lib/catalog";
import { dailyQuoteOrder } from "@/lib/feed";
import { defaultLocalState } from "@/lib/local-state";

export const metadata: Metadata = {
  title: "The App",
  description: "Open Alex Said, a working quote discovery experience built by Tehron Porter."
};

export default function AppPage() {
  const initialQuote = dailyQuoteOrder(catalog.quotes, defaultLocalState)[0] ?? catalog.quotes[0];
  return <QuoteFeed initialQuote={initialQuote} developmentFixture={catalog.developmentFixture} />;
}
