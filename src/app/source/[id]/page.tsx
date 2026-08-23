import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, CheckCircle2, Clock3, ExternalLink, FileText, Mic2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ShareActions } from "@/components/share-actions";
import { catalog, formatTimestamp, quoteRepository } from "@/lib/catalog";

type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() { return catalog.quotes.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const quote = quoteRepository.getById((await params).id); return quote ? { title: `Source · ${quote.text}` } : {}; }

export default async function SourcePage({ params }: Props) {
  const quote = quoteRepository.getById((await params).id);
  if (!quote) notFound();
  const timestamp = formatTimestamp(quote.sourceTimestampSeconds);
  const sourceAction = quote.sourceType === "article" || quote.sourceType === "book" ? "Read original" : quote.sourceType === "podcast" ? "Listen to original" : "Watch original";
  return (
    <main className="page-wrap">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/15 p-7 sm:p-10"><Badge className="bg-black text-white">{quote.primaryCategory}</Badge><span className="display-type mt-12 block text-8xl leading-[0.4]">“</span><blockquote className="display-type mt-8 text-6xl uppercase leading-[0.9] sm:text-8xl">{quote.text}</blockquote><p className="mt-7 text-sm font-extrabold uppercase tracking-[0.1em]">{quote.author}</p></section>
        <Card className="content-card justify-between p-6 sm:p-8">
          <div><div className="flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--purple-light)]">Source</p>{quote.verified ? <Badge className="bg-white text-black"><CheckCircle2 />Verified</Badge> : <Badge variant="outline">Unverified</Badge>}</div><div className="mt-8 space-y-5 text-sm">{[[Mic2, quote.sourceType], [FileText, quote.sourceTitle ?? "Source title unavailable"], [Calendar, quote.sourceDate ?? "Date unavailable"], [Clock3, timestamp ?? "Timestamp unavailable"]].map(([Icon, value]) => { const SourceIcon = Icon as typeof Mic2; return <div key={String(value)} className="flex items-start gap-3"><SourceIcon className="mt-0.5 size-4 shrink-0 text-[var(--purple-light)]" /><span className="capitalize text-white/75">{String(value)}</span></div>; })}</div>{quote.context ? <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/45">{quote.context}</p> : null}</div>
          <div className="mt-8 space-y-3">{quote.sourceURL ? <Button asChild className="w-full bg-white text-black hover:bg-white/90"><a href={quote.sourceURL} target="_blank" rel="noreferrer">{sourceAction}<ExternalLink /></a></Button> : <Button disabled className="w-full">Original unavailable</Button>}<ShareActions quote={quote} trigger={<Button variant="outline" className="w-full border-white/15 bg-transparent text-white hover:bg-white hover:text-black">Share quote</Button>} /><Button asChild variant="ghost" className="w-full text-white/55 hover:bg-white/10 hover:text-white"><Link href={`/q/${quote.id}`}>Back to quote</Link></Button></div>
        </Card>
      </div>
    </main>
  );
}
