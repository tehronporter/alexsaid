"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { Collection, Quote } from "@/domain/catalog";
import { EditorialSection } from "@/components/editorial";
import { ProductIcon } from "@/components/product-icon";
import { QuoteListCard } from "@/components/quote-list-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trackProductEvent } from "@/lib/analytics";
import { rankQuotes } from "@/lib/search";
import { useOptionalCatalog } from "@/components/catalog-provider";

const RECENT_QUOTE_COUNT = 2;
const EMPTY_QUOTES: readonly Quote[] = [];
const EMPTY_CATEGORIES: readonly string[] = [];
const EMPTY_COLLECTIONS: readonly Collection[] = [];

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function DiscoverView({ quotes: suppliedQuotes, categories: suppliedCategories, collections: suppliedCollections, initialTopic = "" }: { quotes?: readonly Quote[]; categories?: readonly string[]; collections?: readonly Collection[]; initialTopic?: string }) {
  const catalogContext = useOptionalCatalog();
  const quotes = suppliedQuotes ?? catalogContext?.catalog?.quotes ?? EMPTY_QUOTES;
  const categories = suppliedCategories ?? catalogContext?.catalog?.categories ?? EMPTY_CATEGORIES;
  const collections = suppliedCollections ?? catalogContext?.catalog?.collections ?? EMPTY_COLLECTIONS;
  const [query, setQuery] = useState(initialTopic);
  const deferredQuery = useDeferredValue(query);

  const topicSummaries = useMemo(() => categories
    .map((category) => ({ category, count: quotes.filter((quote) => quote.primaryCategory === category).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)), [categories, quotes]);

  const recentQuotes = useMemo(() => quotes.toReversed().slice(0, RECENT_QUOTE_COUNT), [quotes]);
  const results = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) return [];
    const exactCategory = categories.find((category) => category.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
    return exactCategory ? quotes.filter((quote) => quote.primaryCategory === exactCategory) : suppliedQuotes ? rankQuotes(quotes, deferredQuery) : catalogContext?.search(deferredQuery) ?? [];
  }, [deferredQuery, quotes, categories, suppliedQuotes, catalogContext]);

  const hasQuery = query.trim().length > 0;
  const clearSearch = () => {
    setQuery("");
    window.history.replaceState(null, "", "/discover");
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      <section aria-label="Search quotes">
        <div className="relative max-w-3xl">
          <ProductIcon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/58" />
          <label htmlFor="discover-search" className="sr-only">Search quotes</label>
          <Input
            id="discover-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape" && query) clearSearch(); }}
            onBlur={() => { if (query.trim()) trackProductEvent("search_performed", { result_count: results.length }); }}
            placeholder="Search quotes or topics…"
            autoComplete="off"
            aria-controls={hasQuery ? "discover-results" : undefined}
            className="h-14 rounded-xl border-white/24 bg-transparent pl-12 pr-14 text-base text-white placeholder:text-white/50 focus-visible:border-[var(--purple-light)] sm:h-16 sm:text-lg"
          />
          {hasQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 size-10 -translate-y-1/2 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ProductIcon name="clear" className="size-5" />
            </Button>
          ) : null}
        </div>
      </section>

      {hasQuery ? (
        <section id="discover-results" aria-labelledby="discover-results-title">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-3 border-b border-white/16 pb-4">
            <h2 id="discover-results-title" className="text-sm font-semibold text-white">Results for “{query.trim()}”</h2>
            <output aria-live="polite" className="text-xs tabular-nums text-white/60">{pluralize(results.length, "result")}</output>
          </div>
          {results.length ? (
            <div className="grid lg:grid-cols-2 lg:gap-x-12">{results.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div>
          ) : (
            <div className="py-10 sm:py-12">
              <p className="text-lg font-semibold text-white">No matching quotes.</p>
              <p className="mt-2 text-sm text-white/60">Try a broader search or choose a topic.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {topicSummaries.map(({ category }) => (
                  <Button key={category} type="button" variant="outline" className="h-9 border-white/18 bg-transparent px-3 text-white/78 hover:border-[var(--purple-light)] hover:bg-white/6 hover:text-white" onClick={() => setQuery(category)}>
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : (
        <>
          <EditorialSection title="Browse topics">
            <div className="flex flex-wrap gap-2">
              {topicSummaries.map(({ category }) => (
                <Badge key={category} asChild variant="outline" className="h-10 border-white/18 px-4 text-sm font-medium text-white/78 hover:border-[var(--purple-light)] hover:bg-white/6 hover:text-white">
                  <Link href={`/discover?topic=${encodeURIComponent(category)}`} onClick={() => trackProductEvent("topic_opened", { category })}>
                    {category}
                  </Link>
                </Badge>
              ))}
            </div>
          </EditorialSection>

          <EditorialSection title="Latest quotes">
            <div className="grid lg:grid-cols-2 lg:gap-x-12">{recentQuotes.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div>
          </EditorialSection>

          <EditorialSection title="Collections">
            <div>
              {collections.toSorted((a, b) => a.displayOrder - b.displayOrder).map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="editorial-link group block border-t border-white/14 py-5 first:border-t-0 focus-visible:outline-offset-[-3px]">
                  <span>
                    <span className="block font-semibold text-white transition-colors group-hover:text-[var(--purple-light)]">{collection.title}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-white/58">{collection.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </EditorialSection>
        </>
      )}
    </div>
  );
}
