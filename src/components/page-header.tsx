import { BrandMark } from "@/components/brand-mark";

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header className="mb-8">
      <BrandMark className="mb-10 lg:hidden" />
      {eyebrow ? <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/60">{eyebrow}</p> : null}
      <h1 className="display-type mt-2 text-6xl uppercase leading-none sm:text-7xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">{description}</p> : null}
    </header>
  );
}
