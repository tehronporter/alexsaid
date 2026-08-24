"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import type { Collection, Quote } from "@/domain/catalog";
import { EditorialSection } from "@/components/editorial";
import { ProductIcon } from "@/components/product-icon";
import { QuoteListCard } from "@/components/quote-list-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trackProductEvent } from "@/lib/analytics";
import { rankQuotes } from "@/lib/search";

const MAX_THEME_LINKS = 8;
const RECENT_QUOTE_COUNT = 4;

function labelForTag(tag: string) {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function DiscoverView({ quotes, categories, collections, initialTopic = "" }: { quotes: readonly Quote[]; categories: readonly string[]; collections: readonly Collection[]; initialTopic?: string }) {
  const [query, setQuery] = useState(initialTopic);
  const deferredQuery = useDeferredValue(query);

  const topicSummaries = useMemo(() => categories
    .map((category) => {
      const categoryQuotes = quotes.filter((quote) => quote.primaryCategory === category);
      const tagCounts = new Map<string, number>();
      for (const quote of categoryQuotes) {
        for (const tag of quote.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      const leadingTags = [...tagCounts]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([tag]) => labelForTag(tag));
      return { category, count: categoryQuotes.length, leadingTags };
    })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)), [categories, quotes]);

  const popularThemes = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const quote of quotes) {
      for (const tag of quote.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    return [...tagCounts]
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_THEME_LINKS)
      .map(([tag, count]) => ({ tag, count }));
  }, [quotes]);

  const recentQuotes = useMemo(() => quotes.toReversed().slice(0, RECENT_QUOTE_COUNT), [quotes]);
  const results = useMemo(() => {
    const trimmed = deferredQuery.trim();
    if (!trimmed) return [];
    const exactCategory = categories.find((category) => category.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
    return exactCategory ? quotes.filter((quote) => quote.primaryCategory === exactCategory) : rankQuotes(quotes, deferredQuery);
  }, [deferredQuery, quotes, categories]);

  const hasQuery = query.trim().length > 0;
  const clearSearch = () => {
    setQuery("");
    window.history.replaceState(null, "", "/discover");
  };

  return (
    <div className="space-y-10 sm:space-y-12">
      <section aria-labelledby="discover-search-title">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="discover-search-title" className="text-lg font-semibold tracking-[-0.025em] text-white sm:text-xl">What do you need right now?</h2>
            <p className="mt-1 text-sm text-white/55">Search the words, problems, or skills on your mind.</p>
          </div>
          <span className="hidden text-xs tabular-nums text-white/60 sm:block">{pluralize(quotes.length, "quote")}</span>
        </div>

        <div className="relative max-w-4xl">
          <ProductIcon name="search" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/58" />
          <label htmlFor="discover-search" className="sr-only">Search quotes</label>
          <Input
            id="discover-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Escape" && query) clearSearch(); }}
            onBlur={() => { if (query.trim()) trackProductEvent("search_performed", { result_count: results.length }); }}
            placeholder="Try focus, retention, sales training…"
            autoComplete="off"
            aria-controls={hasQuery ? "discover-results" : undefined}
            className="h-14 rounded-xl border-white/24 bg-white/[0.025] pl-12 pr-14 text-base text-white placeholder:text-white/45 focus-visible:border-[var(--purple-light)] sm:h-16 sm:text-lg"
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

        {!hasQuery && popularThemes.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Popular themes">
            <span className="mr-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/60">Popular</span>
            {popularThemes.slice(0, 5).map(({ tag }) => (
              <Badge key={tag} asChild variant="outline" className="h-8 border-white/16 px-3 font-medium text-white/68 hover:border-[var(--purple-light)] hover:bg-white/6 hover:text-white">
                <Link href={`/discover?topic=${encodeURIComponent(tag)}`} onClick={() => trackProductEvent("topic_opened", { category: tag })}>{labelForTag(tag)}</Link>
              </Badge>
            ))}
          </div>
        ) : null}
      </section>

      {hasQuery ? (
        <section id="discover-results" aria-labelledby="discover-results-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-white/16 pb-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--purple-light)]">Search results</p>
              <h2 id="discover-results-title" className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-white">“{query.trim()}”</h2>
            </div>
            <output aria-live="polite" className="text-xs tabular-nums text-white/60">{pluralize(results.length, "result")}</output>
          </div>
          {results.length ? (
            <div className="grid lg:grid-cols-2 lg:gap-x-12">{results.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div>
          ) : (
            <Card className="gap-0 border border-white/12 bg-white/[0.025] py-8 ring-0 sm:py-10">
              <CardContent>
                <p className="text-lg font-semibold text-white">No verified ideas match that search.</p>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/58">Try a broader theme or start with one of the most common ideas in the library.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {popularThemes.slice(0, 4).map(({ tag }) => (
                    <Button key={tag} type="button" variant="outline" className="h-9 border-white/16 bg-transparent px-3 text-white/75 hover:border-[var(--purple-light)] hover:bg-white/6 hover:text-white" onClick={() => setQuery(tag)}>
                      {labelForTag(tag)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      ) : (
        <>
          <EditorialSection title="Explore topics" meta={pluralize(topicSummaries.length, "topic")}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {topicSummaries.map(({ category, count, leadingTags }, index) => (
                <Link
                  key={category}
                  href={`/discover?topic=${encodeURIComponent(category)}`}
                  onClick={() => trackProductEvent("topic_opened", { category })}
                  className="group rounded-xl focus-visible:outline-offset-4"
                >
                  <Card className="h-full min-h-36 gap-6 border border-white/10 bg-white/[0.025] py-5 ring-0 transition-colors group-hover:border-[var(--purple-light)] group-hover:bg-white/[0.045]">
                    <CardHeader className="grid-cols-[1fr_auto] px-5">
                      <span className="text-xs tabular-nums text-white/60">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-xs tabular-nums text-[var(--purple-light)]">{count}</span>
                    </CardHeader>
                    <CardContent className="mt-auto px-5">
                      <CardTitle className="text-base font-semibold tracking-[-0.02em] text-white sm:text-lg">{category}</CardTitle>
                      <p className="mt-2 text-xs leading-relaxed text-white/60">{leadingTags.join(" · ")}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </EditorialSection>

          <EditorialSection title="Browse themes" meta={`${popularThemes.length} popular`}>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {popularThemes.map(({ tag, count }) => (
                <Badge key={tag} asChild variant="outline" className="h-10 border-white/16 px-4 text-sm text-white/72 hover:border-[var(--purple-light)] hover:bg-white/6 hover:text-white">
                  <Link href={`/discover?topic=${encodeURIComponent(tag)}`} onClick={() => trackProductEvent("topic_opened", { category: tag })}>
                    {labelForTag(tag)} <span className="ml-1 text-xs tabular-nums text-white/60">{count}</span>
                  </Link>
                </Badge>
              ))}
            </div>
          </EditorialSection>

          <EditorialSection title="Curated collections" meta={pluralize(collections.length, "collection")}>
            <div className="grid gap-3 lg:grid-cols-3">
              {collections.toSorted((a, b) => a.displayOrder - b.displayOrder).map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="group rounded-xl focus-visible:outline-offset-4">
                  <Card className="h-full gap-8 border border-white/10 bg-transparent py-6 ring-0 transition-colors group-hover:border-[var(--purple-light)] group-hover:bg-white/[0.025]">
                    <CardHeader className="grid-cols-[1fr_auto] px-6">
                      <span className="display-type text-5xl leading-none text-[var(--purple-light)]">{String(collection.displayOrder + 1).padStart(2, "0")}</span>
                      <ProductIcon name="arrow" className="mt-1 size-5 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                    </CardHeader>
                    <CardContent className="mt-auto px-6">
                      <CardTitle className="text-lg font-semibold tracking-[-0.02em] text-white">{collection.title}</CardTitle>
                      <p className="mt-2 text-sm leading-relaxed text-white/58">{collection.description}</p>
                      <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/60">{pluralize(collection.quoteIDs.length, "quote")}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </EditorialSection>

          <EditorialSection title="New to the library" meta={`${recentQuotes.length} recent`}>
            <div className="grid lg:grid-cols-2 lg:gap-x-12">{recentQuotes.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div>
          </EditorialSection>
        </>
      )}
    </div>
  );
}
