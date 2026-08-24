export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header className="mb-8 max-w-3xl border-b border-white/16 pb-6 sm:mb-10 sm:pb-8">
      {eyebrow ? <p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-[var(--purple-light)]">{eyebrow}</p> : null}
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">{title}</h1>
      {description ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62 sm:text-base">{description}</p> : null}
    </header>
  );
}
