import { cn } from "@/lib/utils";
import { useBrand } from "@/components/brand-provider";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  const brand = useBrand();
  return (
    <div className={cn("flex items-center gap-3", className)} role="img" aria-label={brand.productName}>
      <span className="brand-monogram" aria-hidden="true"><span>{brand.id === "alex" ? "H" : "L"}</span><span>S</span></span>
      {compact ? null : <span className="text-sm font-extrabold uppercase leading-none tracking-[0.14em]">{brand.productName}</span>}
    </div>
  );
}
