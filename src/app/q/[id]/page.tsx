import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { QuoteFeed } from "@/components/quote-feed";
import { catalog, quoteRepository } from "@/lib/catalog";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() { return catalog.quotes.map((quote) => ({ id: quote.id })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quote = quoteRepository.getById(id);
  if (!quote) return {};
  return {
    title: quote.text,
    description: `“${quote.text}” — ${quote.author}`,
    alternates: { canonical: `/q/${quote.id}` },
    openGraph: { title: quote.text, description: `${quote.author} · ${quote.primaryCategory}`, type: "article", url: `/q/${quote.id}` }
  };
}

export default async function QuotePage({ params }: Props) {
  const { id } = await params;
  if (!quoteRepository.getById(id)) notFound();
  return <QuoteFeed quotes={catalog.quotes} initialQuoteID={id} developmentFixture={catalog.developmentFixture} />;
}
