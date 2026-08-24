"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { Banknote, BriefcaseBusiness, ChevronRight, CircleDollarSign, Dumbbell, Lightbulb, Megaphone, Search, Sparkles, Tag, Users } from "lucide-react";
import type { Collection, Quote } from "@/domain/catalog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuoteListCard } from "@/components/quote-list-card";
import { trackProductEvent } from "@/lib/analytics";
import { rankQuotes } from "@/lib/search";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Business: BriefcaseBusiness, Sales: Megaphone, Offers: Tag, Money: CircleDollarSign,
  Marketing: Sparkles, Mindset: Lightbulb, Fitness: Dumbbell, Leadership: Users, Pricing: Banknote
};

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
    if (exactCategory) return quotes.filter((quote) => quote.primaryCategory === exactCategory);
    return rankQuotes(quotes, deferredQuery);
  }, [deferredQuery, quotes, categories]);

  return (
    <div className="space-y-9">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/45" />
        <span className="sr-only">Search quotes</span>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} onBlur={() => {
          if (query.trim()) trackProductEvent("search_performed", { result_count: results.length });
        }} placeholder="Search quotes, topics, or sources…" className="h-14 border-white/15 bg-black/80 pl-12 text-white placeholder:text-white/55" />
      </label>

      {query.trim() ? (
        <section aria-live="polite">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold uppercase tracking-[0.14em]">Search results</h2><Badge className="bg-black text-white">{results.length}</Badge></div>
          {results.length ? <div className="grid gap-3 lg:grid-cols-2">{results.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div> : <Card className="content-card p-8 text-center"><Search className="mx-auto mb-3 size-7 text-white/50" /><p className="font-semibold">No matching ideas yet.</p><p className="mt-1 text-sm text-white/65">Try a topic like sales, offers, or confidence.</p></Card>}
        </section>
      ) : (
        <>
          <section>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-extrabold uppercase tracking-[0.14em]">Topics</h2><span className="text-xs text-white/60">Browse the library</span></div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(auto-fill,minmax(13rem,1fr))]">
              {topicCounts.slice(0, 10).map(({ category, count }) => {
                const Icon = iconMap[category] ?? Sparkles;
                return <Link key={category} href={`/discover?topic=${encodeURIComponent(category)}`} onClick={() => trackProductEvent("topic_opened", { category })} className="group rounded-2xl border border-white/15 bg-black p-4 transition-transform hover:-translate-y-0.5 hover:border-white/35 active:scale-[0.97]"><Icon className="mb-5 size-5 text-[var(--purple-light)]" /><p className="text-sm font-bold">{category}</p><p className="mt-1 text-xs text-white/60">{count} {count === 1 ? "quote" : "quotes"}</p></Link>;
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-extrabold uppercase tracking-[0.14em]">Collections</h2>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {collections.toSorted((a, b) => a.displayOrder - b.displayOrder).map((collection) => (
                <Link key={collection.slug} href={`/collections/${collection.slug}`} className="content-card group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5 active:scale-[0.98]">
                  <span className="display-type text-5xl text-[var(--purple-light)]">{String(collection.displayOrder + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1"><span className="block font-bold">{collection.title}</span><span className="mt-1 block text-sm text-white/65">{collection.description}</span></span>
                  <ChevronRight className="size-5 text-white/55 transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
