import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MetadataList, type MetadataItem } from "@/components/editorial";
import { ProductIcon } from "@/components/product-icon";
import { Button } from "@/components/ui/button";
import { ShareActions } from "@/components/share-actions";
import { catalog, formatTimestamp, quoteRepository } from "@/lib/catalog";
import { quoteDisplaySize } from "@/lib/typography";

type Props = { params: Promise<{ id: string }> };
export function generateStaticParams() { return catalog.quotes.map(({ id }) => ({ id })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const quote = quoteRepository.getById((await params).id); return quote ? { title: `Source · ${quote.text}` } : {}; }

export default async function SourcePage({ params }: Props) {
  const quote = quoteRepository.getById((await params).id);
  if (!quote) notFound();

  const locatorItems: MetadataItem[] = quote.sourceLocator.kind === "media"
    ? [{ label: "Timestamp", value: [formatTimestamp(quote.sourceLocator.startSeconds), formatTimestamp(quote.sourceLocator.endSeconds ?? null)].filter(Boolean).join("–") }]
    : quote.sourceLocator.kind === "book"
      ? [
          { label: "Edition", value: `${quote.sourceLocator.edition} · ${quote.sourceLocator.publisher} · ${quote.sourceLocator.publicationYear}` },
          { label: "Location", value: [quote.sourceLocator.chapter, quote.sourceLocator.page ? `p. ${quote.sourceLocator.page}` : quote.sourceLocator.digitalLocation].filter(Boolean).join(" · ") },
          ...(quote.sourceLocator.isbn ? [{ label: "ISBN", value: quote.sourceLocator.isbn }] : []),
        ]
      : [{ label: "Location", value: quote.sourceLocator.section ?? quote.sourceLocator.postID ?? "Direct source page" }];
  const metadataItems: MetadataItem[] = [
    { label: "Format", value: quote.sourceType },
    { label: "Title", value: quote.sourceTitle ?? "Source title unavailable" },
    { label: "Published", value: quote.sourceDate ?? "Date unavailable" },
    ...locatorItems,
    { label: "Verification", value: quote.verified ? "●  Checked twice against the original source" : "Verification pending" },
  ];
  const sourceAction = quote.sourceType === "article" || quote.sourceType === "book" || quote.sourceType === "social" ? "Read original" : quote.sourceType === "podcast" ? "Listen to original" : "Watch original";

  return (
    <main className="page-wrap">
      <Link href={`/q/${quote.id}`} className="editorial-link mb-8 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white/68 hover:text-white"><ProductIcon name="back" />Back to quote</Link>
      <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <section className="relative overflow-hidden bg-[var(--purple)] p-7 sm:p-10 lg:sticky lg:top-10">
          <span className="display-type absolute -right-2 -top-16 text-[16rem] leading-none text-white/[0.08]" aria-hidden="true">”</span>
          <div className="relative">
            <p className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.15em] text-white"><span className="h-px w-8 bg-white/70" aria-hidden="true" />{quote.primaryCategory}</p>
            <blockquote className={`display-type mt-16 ${quoteDisplaySize(quote.text, "panel")} uppercase`}>{quote.text}</blockquote>
            <p className="mt-8 border-t border-white/28 pt-5 text-sm font-extrabold uppercase tracking-[0.1em]">{quote.author}</p>
          </div>
        </section>

        <section>
          <header className="mb-7"><p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-[var(--purple-light)]">Source record</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em]">Evidence and context</h1></header>
          <MetadataList items={metadataItems} />
          {quote.context ? <div className="mt-8 border-t border-white/16 pt-6"><h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/62">Context</h2><p className="mt-3 max-w-prose text-sm leading-7 text-white/68">{quote.context}</p></div> : null}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {quote.sourceURL ? <Button asChild className="bg-white text-black hover:bg-white/90"><a href={quote.sourceURL} target="_blank" rel="noreferrer">{sourceAction}<ProductIcon name="external" /></a></Button> : <Button disabled>Original unavailable</Button>}
            <ShareActions quote={quote} trigger={<Button variant="outline" className="border-white/22 bg-transparent text-white hover:bg-white hover:text-black">Share quote<ProductIcon name="share" /></Button>} />
          </div>
        </section>
      </div>
    </main>
  );
}
