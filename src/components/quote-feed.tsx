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
  const saved = state.savedIDs.includes(quote.id);
  const quoteSize = quoteDisplaySize(quote.text);
  const quoteStyle = quoteTypographyStyle(quote.text);
  const swipeLearned = state.successfulSwipeCount >= 3;

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

  const recordSuccessfulSwipe = useCallback(() => {
    const nextCount = Math.min(3, state.successfulSwipeCount + 1);
    if (nextCount !== state.successfulSwipeCount) update({ successfulSwipeCount: nextCount });
  }, [state.successfulSwipeCount, update]);

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
    <main className="quote-surface purple-field safe-pb min-h-dvh lg:pl-20">
      <div className="grid min-h-[calc(100dvh-5.75rem)] lg:min-h-dvh lg:grid-cols-[minmax(0,1fr)_23rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section
          className="quote-stage flex min-h-[calc(100dvh-5.75rem)] select-none flex-col px-[var(--quote-page-margin)] pt-[calc(var(--quote-header-top)+var(--safe-top))] pb-5 md:min-h-dvh md:pb-9 lg:pb-12"
          onTouchStart={(event) => { touchStart.current = event.changedTouches[0]?.clientY ?? null; setDragging(true); }}
          onTouchMove={(event) => {
            if (touchStart.current === null) return;
            const currentY = event.changedTouches[0]?.clientY ?? touchStart.current;
            setDragY(Math.max(-120, Math.min(120, touchStart.current - currentY)));
          }}
          onTouchEnd={(event) => {
            if (touchStart.current === null) { setDragging(false); return; }
            const delta = touchStart.current - (event.changedTouches[0]?.clientY ?? touchStart.current);
            if (Math.abs(delta) > 56) { recordSuccessfulSwipe(); move(delta > 0 ? 1 : -1); }
            touchStart.current = null;
            setDragging(false);
            setDragY(0);
          }}
        >
          <header data-testid="quote-header" className="relative z-10 flex items-baseline justify-between">
            <p className="text-sm font-extrabold tracking-[0.12em]">HORMOZI SAID</p>
            <div className="flex items-center gap-4">
              <p className="text-[0.68rem] font-semibold tabular-nums tracking-[0.08em] text-white/85 lg:hidden">{String(index + 1).padStart(2, "0")}</p>
              {developmentFixture ? <span className="border border-white/30 px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em]">Dev content</span> : null}
            </div>
          </header>

          <div
            data-quote-size={quoteStyle}
            className="quote-composition relative z-10 flex flex-1 items-center py-[var(--quote-composition-space)]"
            style={{ transform: `translateY(${-dragY * 0.4}px)`, transition: dragging ? "none" : "transform 320ms var(--ease-ios)" }}
          >
            <div key={quote.id} className={`w-full ${enterDirection === 1 ? "animate-quote-up" : "animate-quote-down"}`}>
              <div className="quote-category flex items-center gap-3 uppercase text-white"><span className="h-px w-6 bg-white/60" aria-hidden="true" />{quote.primaryCategory}</div>
              <span className="quote-mark display-type text-white" aria-hidden="true">“</span>
              <blockquote data-testid="quote-text" data-quote-size={quoteStyle} className={`display-type mt-2 max-w-4xl ${quoteSize} uppercase tracking-[0.01em] text-white xl:max-w-[64rem] 2xl:max-w-[72rem]`}>{quote.text}</blockquote>
              <div data-testid="quote-author" className="quote-author flex items-center gap-3">
                <span className="hidden h-px w-10 bg-white/40 lg:block" aria-hidden="true" />
                <p className="text-sm font-extrabold uppercase tracking-[0.08em]">{quote.author}</p>
              </div>
            </div>
          </div>

          <div data-testid="quote-actions" className="relative z-10 flex gap-[var(--quote-control-gap)]">
            <Button className="size-[var(--quote-control-size)] rounded-full bg-black p-0 text-white hover:bg-white hover:text-black [&_svg]:size-5" aria-label={saved ? "Remove quote from saved" : "Save quote"} onClick={() => {
              toggleSaved(quote.id);
              trackProductEvent(saved ? "quote_unsaved" : "quote_saved", { quote_id: quote.id, category: quote.primaryCategory });
              if (!saved && !hasShownSaveHint) { hasShownSaveHint = true; toast.success("Saved for later", { description: "Find it anytime in Saved." }); }
              else toast.success(saved ? "Removed from saved" : "Saved for later");
            }}><ProductIcon name="save" filled={saved} /></Button>
            <ShareActions quote={quote} trigger={<Button className="size-[var(--quote-control-size)] rounded-full bg-black p-0 text-white hover:bg-white hover:text-black [&_svg]:size-5" aria-label="Share quote"><ProductIcon name="share" /></Button>} />
            <Button asChild className="size-[var(--quote-control-size)] rounded-full bg-black p-0 text-white hover:bg-white hover:text-black [&_svg]:size-5"><Link href={`/source/${quote.id}`} aria-label="View quote source"><ProductIcon name="external" /></Link></Button>
          </div>

          <p className="swipe-hint relative z-10 text-center text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/85 lg:hidden" data-learned={swipeLearned} aria-hidden={swipeLearned}><span>Swipe for another</span></p>
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
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/45">Source</p>
            <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white/90">{quote.sourceTitle ?? "Source title unavailable"}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-white/55">
              <span className="capitalize">{quote.sourceType}</span>
              {quote.sourceDate ? <><span aria-hidden="true" className="text-white/25">·</span><span>{quote.sourceDate}</span></> : null}
            </div>
            <p className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-white/72">{quote.verified ? "●  Verified twice" : "Verification pending"}</p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full bg-white text-black hover:bg-white/90"><Link href={`/source/${quote.id}`}>View source<ProductIcon name="external" /></Link></Button>
            <ShareActions quote={quote} trigger={<Button variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white hover:text-black">Share this quote<ProductIcon name="share" /></Button>} />
            <p className="pt-3 text-[0.62rem] leading-relaxed text-white/45">Unofficial and fan-made. Quotes are checked twice against direct sources.</p>
          </div>
        </aside>
      </div>
      <OnboardingDialog />
    </main>
  );
}
