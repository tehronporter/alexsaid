import { PageHeader } from "@/components/page-header";

export function LegalPage({ title, updated = "August 23, 2026", children }: { title: string; updated?: string; children: React.ReactNode }) {
  return <main className="page-wrap"><div className="max-w-3xl"><PageHeader eyebrow={`Updated ${updated}`} title={title} /><article className="space-y-9 border-t border-white/16 pt-8 text-sm leading-7 text-white/70">{children}</article></div></main>;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-3 text-base font-semibold text-white">{title}</h2>{children}</section>;
}
