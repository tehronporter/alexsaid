"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Bookmark, ExternalLink, Info, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Quote } from "@/domain/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { ShareActions } from "@/components/share-actions";
import { useUserState } from "@/components/user-state-provider";
import { dailyQuoteOrder } from "@/lib/feed";
import { trackProductEvent } from "@/lib/analytics";

export function QuoteFeed({ quotes, initialQuoteID, developmentFixture = false }: { quotes: readonly Quote[]; initialQuoteID?: string; developmentFixture?: boolean }) {
  const { state, update, toggleSaved } = useUserState();
  const order = useMemo(() => dailyQuoteOrder(quotes, state), [quotes, state]);
  const [selectedQuoteID, setSelectedQuoteID] = useState<string | null>(null);
  const touchStart = useRef<number | null>(null);
  const activeQuoteID = selectedQuoteID ?? initialQuoteID ?? state.lastQuoteID ?? order[0]?.id;
  const index = Math.max(0, order.findIndex((item) => item.id === activeQuoteID));
  const quote = order[index] ?? quotes[0];
  const saved = state.savedIDs.includes(quote.id);

  const move = useCallback((direction: 1 | -1, historyMode: "push" | "replace" = "push") => {
    const nextIndex = (index + direction + order.length) % order.length;
    const nextQuote = order[nextIndex];
    if (nextQuote && typeof window !== "undefined") {
      setSelectedQuoteID(nextQuote.id);
      window.history[historyMode === "push" ? "pushState" : "replaceState"]({}, "", `/q/${nextQuote.id}`);
      update({ lastQuoteID: nextQuote.id });
    }
  }, [index, order, update]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight"].includes(event.key)) move(1);
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) move(-1);
    };
    const onPopState = () => {
      const id = window.location.pathname.match(/^\/q\/([^/]+)$/)?.[1];
      const restoredIndex = order.findIndex((item) => item.id === id);
      if (restoredIndex >= 0) setSelectedQuoteID(order[restoredIndex].id);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("popstate", onPopState);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("popstate", onPopState); };
  }, [move, order]);

  useEffect(() => {
    trackProductEvent("quote_viewed", { quote_id: quote.id, category: quote.primaryCategory });
  }, [quote.id, quote.primaryCategory]);

  if (!quote) return null;
  return (
    <main className="safe-pb min-h-dvh lg:pl-28">
      <div className="mx-auto grid min-h-[calc(100dvh-5.75rem)] max-w-7xl lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section
          className="flex min-h-[calc(100dvh-5.75rem)] select-none flex-col px-6 py-5 sm:px-10 md:min-h-dvh md:px-14 md:py-9 lg:px-20"
          onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientY ?? null; }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) return;
            const delta = touchStart.current - (event.changedTouches[0]?.clientY ?? touchStart.current);
            if (Math.abs(delta) > 56) move(delta > 0 ? 1 : -1);
            touchStart.current = null;
          }}
        >
          <header className="flex items-center justify-between">
            <p className="text-sm font-extrabold tracking-[0.12em]">HORMOZI SAID</p>
            {developmentFixture ? <Badge className="border-white/20 bg-black text-white">DEV CONTENT</Badge> : null}
          </header>
          <div className="flex flex-1 flex-col justify-center py-10 md:py-16">
            <Badge className="mb-7 w-fit rounded-full border-black bg-black px-4 py-1 text-[0.68rem] tracking-[0.12em] text-white">{quote.primaryCategory.toUpperCase()}</Badge>
            <span className="display-type text-8xl leading-[0.45] text-white" aria-hidden="true">“</span>
            <blockquote className="display-type mt-5 max-w-4xl text-[clamp(3.5rem,11vw,8.8rem)] leading-[0.84] uppercase tracking-[0.01em] text-white">{quote.text}</blockquote>
            <p className="mt-7 text-sm font-extrabold uppercase tracking-[0.08em]">{quote.author}</p>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="flex gap-3">
              <Button size="icon-lg" className="rounded-full bg-black text-white hover:bg-white hover:text-black" aria-label={saved ? "Remove quote from saved" : "Save quote"} onClick={() => {
                toggleSaved(quote.id);
                trackProductEvent(saved ? "quote_unsaved" : "quote_saved", { quote_id: quote.id, category: quote.primaryCategory });
                toast.success(saved ? "Removed from saved" : "Saved for later");
              }}><Bookmark fill={saved ? "currentColor" : "none"} /></Button>
              <ShareActions quote={quote} trigger={<Button size="icon-lg" className="rounded-full bg-black text-white hover:bg-white hover:text-black" aria-label="Share quote"><Share2 /></Button>} />
              <Button asChild size="icon-lg" className="rounded-full bg-black text-white hover:bg-white hover:text-black"><Link href={`/source/${quote.id}`} aria-label="View quote source"><Info /></Link></Button>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white hover:text-black" aria-label="Previous quote" onClick={() => move(-1)}><ArrowUp /></Button>
              <Button size="icon" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white hover:text-black" aria-label="Next quote" onClick={() => move(1)}><ArrowDown /></Button>
            </div>
          </div>
          <p className="mt-5 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55">Swipe up or use arrow keys</p>
        </section>
        <aside className="hidden border-l border-white/10 bg-black p-7 text-white lg:flex lg:flex-col">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--purple-light)]">Current idea</p>
          <h2 className="display-type mt-5 text-5xl uppercase leading-[0.92]">The quote is the product.</h2>
          <p className="mt-5 text-sm leading-relaxed text-white/55">Save it, share it, or trace it back to the source. Every action stays tied to this exact quote.</p>
          <div className="mt-auto space-y-3">
            <Button asChild className="w-full bg-white text-black hover:bg-white/90"><Link href={`/source/${quote.id}`}>View source<ExternalLink /></Link></Button>
            <ShareActions quote={quote} trigger={<Button variant="outline" className="w-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black">Share this quote<Share2 /></Button>} />
            <p className="pt-3 text-[0.62rem] leading-relaxed text-white/35">Unofficial and fan-made. Development content requires independent source verification before public release.</p>
          </div>
        </aside>
      </div>
      <OnboardingDialog />
    </main>
  );
}
