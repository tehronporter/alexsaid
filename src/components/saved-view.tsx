"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import type { Quote } from "@/domain/catalog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuoteListCard } from "@/components/quote-list-card";
import { useUserState } from "@/components/user-state-provider";

export function SavedView({ quotes }: { quotes: readonly Quote[] }) {
  const { state } = useUserState();
  const saved = quotes.filter((quote) => state.savedIDs.includes(quote.id));
  if (!saved.length) return (
    <Card className="content-card mx-auto max-w-xl items-center p-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-white/10"><Bookmark className="size-6" /></span>
      <h2 className="mt-5 text-xl font-bold">Your useful ideas will live here.</h2>
      <p className="max-w-sm text-sm leading-relaxed text-white/65">Tap the bookmark on any quote and it will stay saved on this device—even when you’re offline.</p>
      <Button asChild className="mt-2 bg-white text-black hover:bg-white/90"><Link href="/">Find a quote</Link></Button>
    </Card>
  );
  return <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{saved.map((quote) => <QuoteListCard key={quote.id} quote={quote} />)}</div>;
}
