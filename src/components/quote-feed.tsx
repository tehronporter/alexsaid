"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Quote } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { ProductIcon } from "@/components/product-icon";
import { ShareActions } from "@/components/share-actions";
import { useUserState } from "@/components/user-state-provider";
import { dailyQuoteOrder } from "@/lib/feed";
import { trackProductEvent } from "@/lib/analytics";
import { quoteDisplaySize, quoteTypographyStyle } from "@/lib/typography";
import { useOptionalCatalog } from "@/components/catalog-provider";
import { verificationLabel } from "@/lib/verification-label";
import { useBrand } from "@/components/brand-provider";

let hasShownSaveHint = false;
const EMPTY_QUOTES: readonly Quote[] = [];

export function QuoteFeed({ quotes: suppliedQuotes, initialQuote, initialQuoteID, developmentFixture: suppliedDevelopmentFixture }: { quotes?: readonly Quote[]; initialQuote?: Quote; initialQuoteID?: string; developmentFixture?: boolean }) {
  const brand = useBrand();
  const catalogContext = useOptionalCatalog();
  const catalogQuotes = catalogContext?.catalog?.quotes;
  const quotes = useMemo(() => suppliedQuotes ?? catalogQuotes ?? (initialQuote ? [initialQuote] : EMPTY_QUOTES), [suppliedQuotes, catalogQuotes, initialQuote]);
  const developmentFixture = suppliedDevelopmentFixture ?? catalogContext?.catalog?.developmentFixture ?? false;
  const { state, update, toggleSaved } = useUserState();
  const order = useMemo(() => dailyQuoteOrder(quotes, state), [quotes, state]);
  const [selectedQuoteID, setSelectedQuoteID] = useState<string | null>(null);
  const [enterDirection, setEnterDirection] = useState<1 | -1>(1);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ pointerID: number; clientY: number; startedAt: number } | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const activeQuoteID = selectedQuoteID ?? initialQuoteID ?? initialQuote?.id ?? state.lastQuoteID ?? order[0]?.id;
  const index = Math.max(0, order.findIndex((item) => item.id === activeQuoteID));
  const quote = order[index] ?? quotes[0] ?? initialQuote;
  const saved = quote ? state.savedIDs.includes(quote.id) : false;
  const quoteSize = quoteDisplaySize(quote?.text ?? "");
  const quoteStyle = quoteTypographyStyle(quote?.text ?? "");
  const navigationCoachVisible = state.onboardingComplete && state.navigationOnboardingVersion < 2;

  const move = useCallback((direction: 1 | -1, historyMode: "push" | "replace" = "push") => {
    const routeQuoteID = typeof window === "undefined" ? null : window.location.pathname.match(/^\/q\/([^/]+)$/)?.[1];
    const liveIndex = Math.max(0, order.findIndex((item) => item.id === (routeQuoteID ?? activeQuoteID)));
    const nextIndex = (liveIndex + direction + order.length) % order.length;
    const target = order[nextIndex];
    if (target && typeof window !== "undefined") {
      setEnterDirection(direction);
      setSelectedQuoteID(target.id);
      window.history[historyMode === "push" ? "pushState" : "replaceState"]({}, "", `/q/${target.id}`);
      update({ lastQuoteID: target.id });
    }
  }, [activeQuoteID, order, update]);
  const moveRef = useRef(move);

  useEffect(() => {
    moveRef.current = move;
  }, [move]);

  const completeNavigationCoach = useCallback((method: "gesture" | "control") => {
    const nextCount = Math.min(3, state.successfulSwipeCount + 1);
    const updateState = {
      navigationOnboardingVersion: 2,
      ...(method === "gesture" ? { successfulSwipeCount: nextCount } : {})
    };
    if (state.navigationOnboardingVersion < 2 || (method === "gesture" && nextCount !== state.successfulSwipeCount)) update(updateState);
    if (method === "control" && state.navigationOnboardingVersion < 2 && window.matchMedia("(max-width: 1023px)").matches) {
      toast("You can also swipe", { description: "Swipe up for the next quote or down to go back." });
    }
  }, [state.navigationOnboardingVersion, state.successfulSwipeCount, update]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      const blocked = target?.closest("input, textarea, select, [contenteditable='true'], [role='dialog'], [role='menu']");
      if (blocked || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (["ArrowDown", "ArrowRight"].includes(event.key)) { event.preventDefault(); moveRef.current(1); }
      if (["ArrowUp", "ArrowLeft"].includes(event.key)) { event.preventDefault(); moveRef.current(-1); }
    };
    window.addEventListener("keydown", onKeyDown);
    mainRef.current?.setAttribute("data-interactive", "true");
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const id = window.location.pathname.match(/^\/q\/([^/]+)$/)?.[1];
      const restoredIndex = order.findIndex((item) => item.id === id);
      if (restoredIndex >= 0) setSelectedQuoteID(order[restoredIndex].id);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [order]);

  useEffect(() => {
    if (!quote) return;
    trackProductEvent("quote_viewed", { product: brand.id, quote_id: quote.id, category: quote.primaryCategory });
  }, [brand.id, quote]);

  const resetPointer = useCallback(() => {
    pointerStart.current = null;
    setDragging(false);
    setDragY(0);
  }, []);

  const finishPointerNavigation = useCallback((clientY: number) => {
    const start = pointerStart.current;
    if (!start) { resetPointer(); return; }
    const delta = start.clientY - clientY;
    const elapsed = Math.max(1, performance.now() - start.startedAt);
    const velocity = Math.abs(delta) / elapsed;
    const committed = Math.abs(delta) > 56 || (Math.abs(delta) > 28 && velocity > 0.45);
    if (committed) {
      completeNavigationCoach("gesture");
      move(delta > 0 ? 1 : -1);
    }
    resetPointer();
  }, [completeNavigationCoach, move, resetPointer]);

  if (!quote) return <main className="quote-surface purple-field min-h-dvh" aria-busy="true"><p className="sr-only">Loading quote catalog</p></main>;

  return (
    <main ref={mainRef} className="quote-surface purple-field safe-pb min-h-dvh lg:pl-20" data-catalog-ready={quotes.length > 1}>
      <div className="grid min-h-[calc(100dvh-5.75rem)] lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section
          className="quote-stage flex min-h-[calc(100dvh-5.75rem)] select-none flex-col px-[var(--quote-page-margin)] pt-[calc(var(--quote-header-top)+var(--safe-top))] pb-5 md:min-h-dvh md:pb-9 lg:pb-12"
          data-coaching={navigationCoachVisible}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" || event.button !== 0) return;
            pointerStart.current = { pointerID: event.pointerId, clientY: event.clientY, startedAt: performance.now() };
            try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic test events do not own a native pointer capture. */ }
            setDragging(true);
          }}
          onPointerMove={(event) => {
            const start = pointerStart.current;
            if (!start || start.pointerID !== event.pointerId) return;
            event.preventDefault();
            setDragY(Math.max(-120, Math.min(120, start.clientY - event.clientY)));
          }}
          onPointerUp={(event) => finishPointerNavigation(event.clientY)}
          onPointerCancel={resetPointer}
        >
          <div
            className="gesture-preview"
            data-active={dragging || navigationCoachVisible}
            data-direction={dragY < 0 ? "previous" : "next"}
            style={{ opacity: dragging ? Math.min(1, Math.abs(dragY) / 60) : 0.72 }}
            aria-hidden="true"
          >
            {dragY < 0 ? <><ProductIcon name="next" />Previous quote</> : <>Next quote<ProductIcon name="previous" /></>}
          </div>
          <header data-testid="quote-header" className="relative z-10 flex items-baseline justify-between">
            <p className="text-sm font-extrabold tracking-[0.12em]">{brand.productName.toUpperCase()}</p>
            <div className="flex items-center gap-4">
              <p className="text-[0.68rem] font-semibold tabular-nums tracking-[0.08em] text-[var(--quote-muted)] lg:hidden">{String(index + 1).padStart(2, "0")}</p>
              {developmentFixture ? <span className="border border-[var(--quote-rule)] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]">Dev content</span> : null}
            </div>
          </header>

          <div
            data-quote-size={quoteStyle}
            data-coaching={navigationCoachVisible}
            className="quote-composition relative z-10 flex flex-1 items-center py-[var(--quote-composition-space)]"
            style={{ transform: `translateY(${-dragY * 0.4}px)`, transition: dragging ? "none" : "transform 320ms var(--ease-ios)" }}
          >
            <div key={quote.id} className={`w-full ${enterDirection === 1 ? "animate-quote-up" : "animate-quote-down"}`}>
              <div className="quote-category flex items-center gap-3 uppercase text-[var(--quote-fg)]"><span className="h-px w-6 bg-[var(--quote-subtle)]" aria-hidden="true" />{quote.primaryCategory}</div>
              <span className="quote-mark display-type text-[var(--quote-fg)]" aria-hidden="true">“</span>
              <blockquote data-testid="quote-text" data-quote-size={quoteStyle} className={`display-type mt-2 max-w-4xl ${quoteSize} uppercase tracking-[0.01em] text-[var(--quote-fg)] xl:max-w-[64rem] 2xl:max-w-[72rem]`}>{quote.text}</blockquote>
              <div data-testid="quote-author" className="quote-author flex items-center gap-3">
                <span className="hidden h-px w-10 bg-[var(--quote-rule)] lg:block" aria-hidden="true" />
                <p className="text-sm font-extrabold uppercase tracking-[0.08em]">{quote.author}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div data-testid="quote-browse-controls" className="order-1 flex min-h-12 w-full items-center gap-2 lg:order-2 lg:w-auto lg:border-l lg:border-[var(--quote-rule)] lg:pl-5" aria-label="Browse quotes">
              <Button variant="outline" className="h-12 flex-1 border-[var(--quote-rule)] bg-transparent px-4 text-[var(--quote-fg)] hover:bg-black hover:text-white lg:flex-none" aria-label="Previous quote" onClick={() => { completeNavigationCoach("control"); move(-1); }}>
                <ProductIcon name="previous" className="rotate-180 lg:rotate-0" />Previous
              </Button>
              <p className="min-w-14 text-center text-[0.65rem] font-bold tabular-nums tracking-[0.12em] text-[var(--quote-muted)]" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {order.length}</p>
              <Button className="h-12 flex-1 bg-black px-4 text-white hover:bg-white hover:text-black lg:flex-none" aria-label="Next quote" onClick={() => { completeNavigationCoach("control"); move(1); }}>
                Next quote<ProductIcon name="next" className="rotate-180 lg:rotate-0" />
              </Button>
              <p className="hidden text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[var(--quote-muted)] xl:block">Arrow keys work too</p>
            </div>
            <p className="navigation-coach order-2 text-center text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[var(--quote-muted)] lg:hidden" data-visible={navigationCoachVisible} aria-hidden={!navigationCoachVisible}>
              <span><strong>Swipe up for next</strong><span aria-hidden="true"> · </span>Swipe down to go back</span>
            </p>
            <div data-testid="quote-actions" className="order-3 flex items-center justify-center gap-[var(--quote-control-gap)] lg:order-1 lg:justify-start">
              <Button className="size-[var(--quote-control-size)] rounded-full bg-black p-0 text-white hover:bg-white hover:text-black [&_svg]:size-5" aria-label={saved ? "Remove quote from saved" : "Save quote"} onClick={() => {
                toggleSaved(quote.id);
                trackProductEvent(saved ? "quote_unsaved" : "quote_saved", { product: brand.id, quote_id: quote.id, category: quote.primaryCategory });
                if (!saved && !hasShownSaveHint) { hasShownSaveHint = true; toast.success("Saved for later", { description: "Find it anytime in Saved." }); }
                else toast.success(saved ? "Removed from saved" : "Saved for later");
              }}><ProductIcon name="save" filled={saved} /></Button>
              <ShareActions quote={quote} trigger={<Button className="size-[var(--quote-control-size)] rounded-full bg-black p-0 text-white hover:bg-white hover:text-black [&_svg]:size-5" aria-label="Share quote"><ProductIcon name="share" /></Button>} />
              <Button asChild className="size-[var(--quote-control-size)] rounded-full bg-black p-0 text-white hover:bg-white hover:text-black [&_svg]:size-5"><Link href={`/source/${quote.id}`} aria-label="View quote source"><ProductIcon name="external" /></Link></Button>
            </div>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">Quote {index + 1} of {order.length}, by {quote.author}.</p>
        </section>

        <aside className="rail-glass hidden gap-10 border-l border-white/10 px-7 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-baseline justify-between">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--purple-light)]">Today&rsquo;s rotation</p>
              <p className="text-xs font-semibold tabular-nums text-white/62">{String(index + 1).padStart(2, "0")}</p>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/12">
              <div className="h-full rounded-full bg-[var(--purple-light)] transition-[width] duration-500 ease-[var(--ease-ios)]" style={{ width: `${((index + 1) / order.length) * 100}%` }} />
            </div>
            <h2 className="display-type mt-9 text-4xl uppercase leading-[0.95] xl:text-5xl">{quote.primaryCategory}</h2>
            {quote.context ? <p className="mt-4 text-sm leading-relaxed text-white/65">{quote.context}</p> : null}
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/55">Source</p>
            <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white/90">{quote.sourceTitle ?? "Source title unavailable"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-white/55">
              <span className="capitalize">{quote.sourceType}</span>
              {quote.sourceDate ? <><span aria-hidden="true" className="text-white/25">·</span><span>{quote.sourceDate}</span></> : null}
            </div>
            <p className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-white/72">{verificationLabel(quote)}</p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-white text-black hover:bg-white/90"><Link href={`/source/${quote.id}`}>View source<ProductIcon name="external" /></Link></Button>
            <ShareActions quote={quote} trigger={<Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white hover:text-black">Share this quote<ProductIcon name="share" /></Button>} />
            <p className="pt-3 text-[0.62rem] leading-relaxed text-white/55">Unofficial and fan-made. Every quote links to its public source and states its review standard.</p>
          </div>
        </aside>
      </div>
      <OnboardingDialog />
    </main>
  );
}
