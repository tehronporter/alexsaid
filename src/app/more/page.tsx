import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileCheck2, Mail, ScrollText, Settings, ShieldCheck, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "More" };
const links = [
  { href: "/settings", title: "Settings", body: "Topics, local data, and feed preferences", icon: Settings },
  { href: "/install", title: "Install", body: "Add Hormozi Said to your Home Screen", icon: Smartphone },
  { href: "/disclaimer", title: "Disclaimer", body: "Unofficial status and source policy", icon: FileCheck2 },
  { href: "/privacy", title: "Privacy", body: "What stays on this device", icon: ShieldCheck },
  { href: "/terms", title: "Terms", body: "The rules for using this app", icon: ScrollText }
];

export default function MorePage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";
  const rows = [...links, { href: `mailto:${contact}?subject=Hormozi%20Said%20quote%20suggestion`, title: "Suggest a quote", body: "Send the quote and its original source", icon: Mail }];
  return (
    <main className="page-wrap">
      <PageHeader eyebrow="The useful details" title="More" description="Preferences, policies, and a direct way to suggest a source." />
      <div className="overflow-hidden rounded-3xl border border-white/14 bg-black/[0.92] text-white lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:rounded-none lg:border-none lg:bg-transparent">
        {rows.map(({ href, title, body, icon: Icon }, index) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-4 p-5 transition-transform active:scale-[0.98]",
              index !== rows.length - 1 && "border-b border-white/10 lg:border-b-0",
              "lg:rounded-2xl lg:border lg:border-white/14 lg:bg-black/[0.92] lg:[box-shadow:var(--shadow-card)]"
            )}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10"><Icon className="size-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="mt-1 block text-sm text-white/65">{body}</span></span>
            <ChevronRight className="size-5 shrink-0 text-white/45 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-white/55">Hormozi Said is an unofficial, fan-made project. It is not affiliated with, endorsed by, or sponsored by Alex Hormozi, Acquisition.com, or their related companies.</p>
    </main>
  );
}
