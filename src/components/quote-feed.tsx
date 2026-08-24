"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Bookmark, CheckCircle2, ExternalLink, Info, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Quote } from "@/domain/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { ShareActions } from "@/components/share-actions";
import { useUserState } from "@/components/user-state-provider";
import { dailyQuoteOrder } from "@/lib/feed";
import { trackProductEvent } from "@/lib/analytics";
import { quoteDisplaySize } from "@/lib/typography";

let hasShownSaveHint = false;

export function QuoteFeed({ quotes, initialQuoteID, developmentFixture = false }: { quotes: readonly Quote[]; initialQuoteID?: string; developmentFixture?: boolean }) {
  const { state, update, toggleSaved } = useUserState();
  const order = useMemo(() => dailyQuoteOrder(quotes, state), [quotes, state]);
  const [selectedQuoteID, setSelectedQuoteID] = useState<string | null>(null);
  const [enterDirection, setEnterDirection] = useState<1 | -1>(1);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStart = useRef<number | null>(null);
  const activeQuoteID = selectedQuoteID ?? initialQuoteID ?? state.lastQuoteID ?? order[0]?.id;
  const index = Math.max(0, order.findIndex((item) => item.id === activeQuoteID));
  const quote = order[index] ?? quotes[0];
  const nextQuote = order[(index + 1) % order.length];
  const saved = state.savedIDs.includes(quote.id);
  const quoteSize = quoteDisplaySize(quote.text);

  const move = useCallback((direction: 1 | -1, historyMode: "push" | "replace" = "push") => {
    const nextIndex = (index + direction + order.length) % order.length;
    const target = order[nextIndex];
    if (target && typeof window !== "undefined") {
      setEnterDirection(direction);
      setSelectedQuoteID(target.id);
      window.history[historyMode === "push" ? "pushState" : "replaceState"]({}, "", `/q/${target.id}`);
      update({ lastQuoteID: target.id });
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
    <main className="safe-pb min-h-dvh lg:pl-24">
      <div className="grid min-h-[calc(100dvh-5.75rem)] lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section
          className="quote-stage flex min-h-[calc(100dvh-5.75rem)] select-none flex-col px-6 pt-[calc(1.25rem+var(--safe-top))] pb-5 sm:px-10 md:min-h-dvh md:px-14 md:pt-[calc(2.25rem+var(--safe-top))] md:pb-9 lg:px-16 lg:py-12 xl:px-20"
          onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientY ?? null; setDragging(true); }}
          onTouchMove={(event) => {
            if (touchStart.current === null) return;
            const currentY = event.changedTouches[0]?.clientY ?? touchStart.current;
            setDragY(Math.max(-120, Math.min(120, touchStart.current - currentY)));
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) { setDragging(false); return; }
            const delta = touchStart.current - (event.changedTouches[0]?.clientY ?? touchStart.current);
            if (Math.abs(delta) > 56) move(delta > 0 ? 1 : -1);
            touchStart.current = null;
            setDragging(false);
            setDragY(0);
          }}
        >
          <span aria-hidden="true" className="display-type pointer-events-none absolute -top-16 right-6 z-0 hidden select-none text-[26rem] leading-none text-white/[0.055] lg:block xl:right-12 xl:text-[32rem]">”</span>

          <header className="relative z-10 flex items-center justify-between">
            <p className="text-sm font-extrabold tracking-[0.12em]">HORMOZI SAID</p>
            {developmentFixture ? <Badge className="border-white/20 bg-black text-white">DEV CONTENT</Badge> : null}
          </header>

          <div
            className="relative z-10 flex flex-1 flex-col justify-start pt-[8vh] pb-10 sm:justify-center sm:pt-0 sm:pb-10 md:pb-16 lg:pb-12"
            style={{ transform: `translateY(${-dragY * 0.4}px)`, transition: dragging ? "none" : "transform 320ms var(--ease-ios)" }}
          >
            <div key={quote.id} className={enterDirection === 1 ? "animate-quote-up" : "animate-quote-down"}>
              <Badge className="mb-7 w-fit rounded-full border-black bg-black px-4 py-1 text-[0.68rem] tracking-[0.12em] text-white">{quote.primaryCategory.toUpperCase()}</Badge>
              <span className="display-type block text-8xl leading-[0.45] text-white lg:hidden" aria-hidden="true">“</span>
              <blockquote className={`display-type mt-5 max-w-4xl ${quoteSize} leading-[0.86] uppercase tracking-[0.01em] text-white lg:mt-0 xl:max-w-[64rem] 2xl:max-w-[72rem]`}>{quote.text}</blockquote>
              <div className="mt-7 flex items-center gap-3 lg:mt-9">
                <span className="hidden h-px w-10 bg-white/40 lg:block" aria-hidden="true" />
                <p className="text-sm font-extrabold uppercase tracking-[0.08em]">{quote.author}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex gap-3">
              <Button size="icon-lg" className="rounded-full bg-black text-white hover:bg-white hover:text-black" aria-label={saved ? "Remove quote from saved" : "Save quote"} onClick={() => {
                toggleSaved(quote.id);
                trackProductEvent(saved ? "quote_unsaved" : "quote_saved", { quote_id: quote.id, category: quote.primaryCategory });
                if (!saved && !hasShownSaveHint) { hasShownSaveHint = true; toast.success("Saved for later", { description: "Find it anytime in Saved." }); }
                else toast.success(saved ? "Removed from saved" : "Saved for later");
              }}><Bookmark fill={saved ? "currentColor" : "none"} /></Button>
              <ShareActions quote={quote} trigger={<Button size="icon-lg" className="rounded-full bg-black text-white hover:bg-white hover:text-black" aria-label="Share quote"><Share2 /></Button>} />
              <Button asChild size="icon-lg" className="rounded-full bg-black text-white hover:bg-white hover:text-black"><Link href={`/source/${quote.id}`} aria-label="View quote source"><Info /></Link></Button>
            </div>
            <div className="flex items-center gap-4">
              <p className="hidden text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/55 lg:block">Arrow keys</p>
              <div className="flex gap-2">
                <Button size="icon" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white hover:text-black" aria-label="Previous quote" onClick={() => move(-1)}><ArrowUp /></Button>
                <Button size="icon" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white hover:text-black" aria-label="Next quote" onClick={() => move(1)}><ArrowDown /></Button>
              </div>
            </div>
          </div>

          <p className="relative z-10 mt-5 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/65 lg:hidden">Swipe for another</p>
        </section>

        <aside className="rail-glass hidden gap-10 border-l border-white/10 px-7 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--purple-light)]">Today&rsquo;s rotation</p>
              <p className="text-xs font-semibold tabular-nums text-white/70">{String(index + 1).padStart(2, "0")} <span className="text-white/35">/ {String(order.length).padStart(2, "0")}</span></p>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-[var(--purple-light)] transition-[width] duration-500 ease-[var(--ease-ios)]" style={{ width: `${((index + 1) / order.length) * 100}%` }} />
            </div>
            <h2 className="display-type mt-9 text-4xl uppercase leading-[0.95] xl:text-5xl">{quote.primaryCategory}</h2>
            {quote.context ? <p className="mt-4 text-sm leading-relaxed text-white/65">{quote.context}</p> : null}
          </div>

          <div>
            <div className="border-t border-white/10 pt-6">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Source</p>
              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white/90">{quote.sourceTitle ?? "Source title unavailable"}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-white/55">
                <span className="capitalize">{quote.sourceType}</span>
                {quote.sourceDate ? <><span aria-hidden="true" className="text-white/25">·</span><span>{quote.sourceDate}</span></> : null}
              </div>
              {quote.verified
                ? <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white"><CheckCircle2 className="size-3.5" />Verified twice</span>
                : <span className="mt-4 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">Verification pending</span>}
            </div>

            {nextQuote && nextQuote.id !== quote.id ? (
              <button type="button" onClick={() => move(1)} className="group mt-6 w-full rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-left transition-all hover:border-white/30 hover:bg-white/[0.08] active:scale-[0.98]">
                <div className="flex items-center justify-between">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Up next</p>
                  <ArrowDown className="size-3.5 text-white/40 transition-transform group-hover:translate-y-0.5" />
                </div>
                <p className="mt-2.5 line-clamp-2 text-sm leading-snug text-white/85">{nextQuote.text}</p>
                <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--purple-light)]">{nextQuote.primaryCategory}</p>
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-white text-black hover:bg-white/90"><Link href={`/source/${quote.id}`}>View source<ExternalLink /></Link></Button>
            <ShareActions quote={quote} trigger={<Button variant="outline" className="w-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black">Share this quote<Share2 /></Button>} />
            <p className="pt-3 text-[0.62rem] leading-relaxed text-white/45">Unofficial and fan-made. Quotes are checked twice against direct sources.</p>
          </div>
        </aside>
      </div>
      <OnboardingDialog />
    </main>
  );
}
