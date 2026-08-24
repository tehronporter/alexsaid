import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EditorialSection({ title, meta, children, className, ...props }: ComponentProps<"section"> & { title?: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn("border-t border-white/16 pt-5", className)} {...props}>
      {title || meta ? (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          {title ? <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-white/78">{title}</h2> : <span />}
          {meta ? <div className="text-xs tabular-nums text-white/48">{meta}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EditorialRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("border-t border-white/12 py-5 first:border-t-0", className)}>{children}</div>;
}

export function QuotePreviewRow({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cn("group relative border-t border-white/16 first:border-t-0", className)}>{children}</article>;
}

export interface MetadataItem {
  label: string;
  value: ReactNode;
}

export function MetadataList({ items, className }: { items: readonly MetadataItem[]; className?: string }) {
  return (
    <dl className={cn("border-t border-white/16", className)}>
      {items.map(({ label, value }) => (
        <div key={label} className="grid gap-1 border-b border-white/12 py-4 sm:grid-cols-[8rem_1fr] sm:gap-6">
          <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-white/45">{label}</dt>
          <dd className="text-sm leading-relaxed text-white/82 first-letter:uppercase">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
