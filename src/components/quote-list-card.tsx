"use client";

import Link from "next/link";
import type { Quote } from "@/domain/catalog";
import { ProductIcon } from "@/components/product-icon";
import { QuotePreviewRow } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { useUserState } from "@/components/user-state-provider";
import { trackProductEvent } from "@/lib/analytics";

export function QuoteListCard({ quote }: { quote: Quote }) {
  const { state, toggleSaved } = useUserState();
  const saved = state.savedIDs.includes(quote.id);
  return (
    <QuotePreviewRow>
      <Link
        href={`/q/${quote.id}`}
        aria-label={`Read quote: ${quote.text}`}
        className="editorial-link block py-6 pr-14 focus-visible:outline-offset-[-3px] sm:py-7"
      >
        <blockquote className="max-w-3xl text-base font-medium leading-[1.45] tracking-[-0.012em] text-white sm:text-lg">{quote.text}</blockquote>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em]">
          <span className="text-[var(--purple-light)]">{quote.primaryCategory}</span>
          <span aria-hidden="true" className="text-white/30">/</span>
          <span className="normal-case tracking-normal text-white/58">{quote.sourceTitle ?? quote.sourceType}</span>
        </div>
      </Link>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-0 top-4 rounded-full text-white/65 hover:bg-white/8 hover:text-white sm:top-5"
        aria-label={saved ? "Remove from saved" : "Save quote"}
        onClick={() => {
          toggleSaved(quote.id);
          trackProductEvent(saved ? "quote_unsaved" : "quote_saved", { quote_id: quote.id, category: quote.primaryCategory });
        }}
      >
        <ProductIcon name="save" filled={saved} />
      </Button>
    </QuotePreviewRow>
  );
}
