import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="img" aria-label="Hormozi Said">
      <span className="grid size-10 place-items-center rounded-xl border border-white/25 bg-black text-3xl leading-none" aria-hidden="true">“</span>
      {compact ? null : <span className="display-type text-2xl leading-none tracking-[0.08em]">Hormozi Said</span>}
    </div>
  );
}
