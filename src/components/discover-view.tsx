"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { Collection, Quote } from "@/domain/catalog";
import { EditorialSection } from "@/components/editorial";
import { ProductIcon } from "@/components/product-icon";
import { Input } from "@/components/ui/input";
import { QuoteListCard } from "@/components/quote-list-card";
import { trackProductEvent } from "@/lib/analytics";
import { rankQuotes } from "@/lib/search";

export function DiscoverView({ quotes, categories, collections, initialTopic = "" }: { quotes: readonly Quote[]; categories: readonly string[]; collections: readonly Collection[]; initialTopic?: string }) {
  const [query, setQuery] = useState(initialTopic);
  const deferredQuery = useDeferredValue(query);
  const topicCounts = useMemo(() => categories
    .map((category) => ({ category, count: quotes.filter((quote) => quote.primaryCategory === category).length }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)), [categories, quotes]);
  const results = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) return [];
    const exactCategory = categories.find((category) => category.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
    return exactCategory ? quotes.filter((quote) => quote.primaryCategory === exactCategory) : rankQuotes(quotes, deferredQuery);
  }, [deferredQuery, quotes, categories]);

  return (
    <div className="space-y-12">
      <label className="relative block max-w-3xl">
        <ProductIcon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/58" />
        <span className="sr-only">Search quotes</span>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => { if (query.trim()) trackProductEvent("search_performed", { result_count: results.length }); }}
          placeholder="Search quotes, topics, or sources…"
          className="h-12 rounded-xl border-white/22 bg-transparent pl-12 text-white placeholder:text-white/55 focus-visible:border-[var(--purple-light)]"
        />
      </label>

      {query.trim() ? (
        <EditorialSection title="Search results" meta={`${results.length} ${results.length === 1 ? "result" : "results"}`} aria-live="polite">
          {results.length ? <div className="grid lg:grid-cols-2 lg:gap-x-12">{results.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div> : <div className="py-12"><p className="text-lg font-semibold">No matching ideas yet.</p><p className="mt-2 text-sm text-white/62">Try a topic like sales, offers, or confidence.</p></div>}
        </EditorialSection>
      ) : (
        <>
          <EditorialSection title="Topics" meta="Browse the library">
            <div className="grid sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3">
              {topicCounts.slice(0, 12).map(({ category, count }, index) => (
                <Link
                  key={category}
                  href={`/discover?topic=${encodeURIComponent(category)}`}
                  onClick={() => trackProductEvent("topic_opened", { category })}
                  className="editorial-link group grid grid-cols-[2.25rem_1fr_auto] items-baseline gap-3 border-t border-white/14 py-5 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:[&:nth-child(3)]:border-t-0"
                >
                  <span className="text-xs tabular-nums text-white/48">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-semibold text-white transition-colors group-hover:text-[var(--purple-light)]">{category}</span>
                  <span className="text-xs tabular-nums text-white/55">{count}</span>
                </Link>
              ))}
            </div>
          </EditorialSection>

          <EditorialSection title="Collections" meta={`${collections.length} curated`}>
            <div className="grid lg:grid-cols-2 lg:gap-x-12">
              {collections.toSorted((a, b) => a.displayOrder - b.displayOrder).map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="editorial-link group grid grid-cols-[4rem_1fr] gap-4 border-t border-white/14 py-7 first:border-t-0 lg:[&:nth-child(2)]:border-t-0">
                  <span className="display-type text-5xl leading-none text-[var(--purple-light)]">{String(collection.displayOrder + 1).padStart(2, "0")}</span>
                  <span><span className="block text-lg font-semibold tracking-[-0.02em] transition-colors group-hover:text-[var(--purple-light)]">{collection.title}</span><span className="mt-2 block text-sm leading-relaxed text-white/60">{collection.description}</span></span>
                </Link>
              ))}
            </div>
          </EditorialSection>
        </>
      )}
    </div>
  );
}
