import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { QuoteListCard } from "@/components/quote-list-card";
import { catalog, quoteRepository, quotesForCollection } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() { return catalog.collections.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const collection = quoteRepository.getCollection((await params).slug); return collection ? { title: collection.title, description: collection.description } : {}; }

export default async function CollectionPage({ params }: Props) {
  const collection = quoteRepository.getCollection((await params).slug);
  if (!collection) notFound();
  const quotes = quotesForCollection(collection);
  return <main className="page-wrap"><PageHeader eyebrow={`${quotes.length} quotes`} title={collection.title} description={collection.description} /><div className="grid lg:grid-cols-2 lg:gap-x-12">{quotes.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div></main>;
}
