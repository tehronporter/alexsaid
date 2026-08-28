"use client";

import Link from "next/link";
import type { Quote } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { QuoteListCard } from "@/components/quote-list-card";
import { useUserState } from "@/components/user-state-provider";
import { useOptionalCatalog } from "@/components/catalog-provider";
import { useBrand } from "@/components/brand-provider";

export function SavedView({ quotes: suppliedQuotes }: { quotes?: readonly Quote[] }) {
  const brand = useBrand();
  const catalogContext = useOptionalCatalog();
  const quotes = suppliedQuotes ?? catalogContext?.catalog?.quotes ?? [];
  const { state } = useUserState();
  const saved = quotes.filter((quote) => state.savedIDs.includes(quote.id));
  if (!saved.length) return (
    <section className="max-w-xl border-t border-white/16 py-12">
      <p className="text-xl font-semibold tracking-[-0.025em]">Your useful ideas will live here.</p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/62">Save any quote and it will stay on this device—even when you’re offline.</p>
      <Button asChild className="mt-7 bg-white text-black hover:bg-white/90"><Link href={brand.homePath}>Browse quotes</Link></Button>
    </section>
  );
  return <div className="grid lg:grid-cols-2 lg:gap-x-12">{saved.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div>;
}
