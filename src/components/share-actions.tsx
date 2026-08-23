"use client";

import { useState } from "react";
import { Copy, Download, Image as ImageIcon, Link as LinkIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Quote } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { downloadShareCard, renderShareCardBlob } from "@/lib/share-card";
import { trackProductEvent } from "@/lib/analytics";

function canonicalURL(quote: Quote) {
  return `${window.location.origin}/q/${quote.id}`;
}

export function ShareActions({ quote, trigger }: { quote: Quote; trigger?: React.ReactNode }) {
  const [busy, setBusy] = useState(false);
  const copyQuote = async () => {
    await navigator.clipboard.writeText(`“${quote.text}” — ${quote.author}`);
    trackProductEvent("quote_shared", { quote_id: quote.id, method: "copy_quote" });
    toast.success("Quote copied");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(canonicalURL(quote));
    trackProductEvent("quote_shared", { quote_id: quote.id, method: "copy_link" });
    toast.success("Link copied");
  };
  const share = async () => {
    if (!navigator.share) { await copyLink(); return; }
    setBusy(true);
    try {
      const blob = await renderShareCardBlob(quote, "square");
      const file = new File([blob], `hormozi-said-${quote.id}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Hormozi Said", text: `“${quote.text}” — ${quote.author}`, url: canonicalURL(quote), files: [file] });
      } else {
        await navigator.share({ title: "Hormozi Said", text: `“${quote.text}” — ${quote.author}`, url: canonicalURL(quote) });
      }
      trackProductEvent("quote_shared", { quote_id: quote.id, method: "native" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Sharing is unavailable right now");
    } finally { setBusy(false); }
  };
  const download = async (format: "square" | "story") => {
    setBusy(true);
    try {
      await downloadShareCard(quote, format);
      trackProductEvent("quote_shared", { quote_id: quote.id, method: `download_${format}` });
      toast.success(`${format === "square" ? "Square" : "Story"} card saved`);
    } catch { toast.error("Could not create the card"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? <Button aria-label="Share quote" size="icon" className="rounded-full"><Share2 /></Button>}</DialogTrigger>
      <DialogContent className="fixed inset-x-0 bottom-0 top-auto left-0 w-full max-w-full translate-x-0 translate-y-0 rounded-t-3xl rounded-b-none border-x-0 border-b-0 border-t border-white/15 bg-black pb-[calc(1.25rem+var(--safe-bottom))] text-white sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-4">
        <DialogHeader><DialogTitle>Share this idea</DialogTitle><DialogDescription className="text-white/60">Copy it, send it, or make a clean quote card.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black" onClick={copyQuote}><Copy />Copy quote</Button>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black" onClick={copyLink}><LinkIcon />Copy link</Button>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black" disabled={busy} onClick={() => download("square")}><ImageIcon />Square card</Button>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white hover:text-black" disabled={busy} onClick={() => download("story")}><Download />Story card</Button>
        </div>
        <Button className="bg-white text-black hover:bg-white/90" disabled={busy} onClick={share}><Share2 />{busy ? "Preparing…" : "Open share sheet"}</Button>
      </DialogContent>
    </Dialog>
  );
}
