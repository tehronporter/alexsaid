import type { Metadata } from "next";
import { QuoteFeed } from "@/components/quote-feed";
import { catalog } from "@/lib/catalog";
import { dailyQuoteOrder } from "@/lib/feed";
import { defaultLocalState } from "@/lib/local-state";
import { activeBrand, isLeilaProduct } from "@/lib/product";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "The App",
  description: `Open ${activeBrand.productName}, a working quote discovery experience built by Tehron Porter.`
};

export default function AppPage() {
  if (isLeilaProduct) redirect("/");
  const initialQuote = dailyQuoteOrder(catalog.quotes, defaultLocalState)[0] ?? catalog.quotes[0];
  return <QuoteFeed initialQuote={initialQuote} developmentFixture={catalog.developmentFixture} />;
}
