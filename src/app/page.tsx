import { QuoteFeed } from "@/components/quote-feed";
import { catalog } from "@/lib/catalog";
import { dailyQuoteOrder } from "@/lib/feed";
import { defaultLocalState } from "@/lib/local-state";

export default function HomePage() {
  const initialQuote = dailyQuoteOrder(catalog.quotes, defaultLocalState)[0] ?? catalog.quotes[0];
  return <QuoteFeed initialQuote={initialQuote} developmentFixture={catalog.developmentFixture} />;
}
