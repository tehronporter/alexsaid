import { QuoteFeed } from "@/components/quote-feed";
import { catalog } from "@/lib/catalog";

export default function HomePage() {
  return <QuoteFeed quotes={catalog.quotes} developmentFixture={catalog.developmentFixture} />;
}
