"use client";

import Link from "next/link";
import { Bookmark, ChevronRight, Quote as QuoteIcon } from "lucide-react";
import type { Quote } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUserState } from "@/components/user-state-provider";
import { trackProductEvent } from "@/lib/analytics";

export function QuoteListCard({ quote }: { quote: Quote }) {
  const { state, toggleSaved } = useUserState();
  const saved = state.savedIDs.includes(quote.id);
  return (
    <Card className="content-card group relative gap-3 overflow-hidden p-5">
      <div className="flex items-start gap-3">
        <QuoteIcon className="mt-0.5 size-6 shrink-0 text-[var(--purple-light)]" fill="currentColor" />
        <Link href={`/q/${quote.id}`} className="min-w-0 flex-1 pr-8">
          <p className="text-base font-semibold leading-snug text-white">{quote.text}</p>
          <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--purple-light)]">{quote.primaryCategory}</p>
        </Link>
        <Button variant="ghost" size="icon-sm" className="absolute right-2 top-2 text-white hover:bg-white/10 hover:text-white" aria-label={saved ? "Remove from saved" : "Save quote"} onClick={() => {
          toggleSaved(quote.id);
          trackProductEvent(saved ? "quote_unsaved" : "quote_saved", { quote_id: quote.id, category: quote.primaryCategory });
        }}><Bookmark fill={saved ? "currentColor" : "none"} /></Button>
      </div>
      <Link href={`/q/${quote.id}`} className="flex items-center justify-end gap-1 text-xs font-semibold text-white/45 transition-colors group-hover:text-white">Read quote<ChevronRight className="size-3.5" /></Link>
    </Card>
  );
}
