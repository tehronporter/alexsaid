import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)} role="img" aria-label="Hormozi Said">
      <span className="brand-monogram" aria-hidden="true"><span>H</span><span>S</span></span>
      {compact ? null : <span className="text-sm font-extrabold uppercase leading-none tracking-[0.14em]">Hormozi Said</span>}
    </div>
  );
}
