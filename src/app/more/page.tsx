import type { Metadata } from "next";
import Link from "next/link";
import { EditorialSection } from "@/components/editorial";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "More" };

const appLinks = [
  { href: "/settings", title: "Settings", body: "Topics, local data, and feed preferences" },
  { href: "/install", title: "Install", body: "Add Hormozi Said to your Home Screen" },
];

const legalLinks = [
  { href: "/disclaimer", title: "Disclaimer", body: "Unofficial status and source policy" },
  { href: "/privacy", title: "Privacy", body: "What stays on this device" },
  { href: "/terms", title: "Terms", body: "The rules for using this app" },
];

function LinkDirectory({ links, offset = 0 }: { links: readonly { href: string; title: string; body: string }[]; offset?: number }) {
  return (
    <div>
      {links.map(({ href, title, body }, index) => (
        <Link key={href} href={href} className="editorial-link group grid grid-cols-[2.5rem_1fr] gap-4 border-t border-white/14 py-5 first:border-t-0 sm:grid-cols-[3rem_1fr]">
          <span className="pt-1 text-xs tabular-nums text-white/50">{String(offset + index + 1).padStart(2, "0")}</span>
          <span><span className="block text-base font-semibold transition-colors group-hover:text-[var(--purple-light)]">{title}</span><span className="mt-1 block text-sm leading-relaxed text-white/60">{body}</span></span>
        </Link>
      ))}
    </div>
  );
}

export default function MorePage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";
  const supportLinks = [{ href: `mailto:${contact}?subject=Hormozi%20Said%20quote%20suggestion`, title: "Suggest a quote", body: "Send the quote and its original source" }];
  return (
    <main className="page-wrap">
      <PageHeader eyebrow="Directory" title="More" description="Preferences, policies, and a direct way to suggest a source." />
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-16">
        <div className="space-y-12"><EditorialSection title="App"><LinkDirectory links={appLinks} /></EditorialSection><EditorialSection title="Support"><LinkDirectory links={supportLinks} offset={2} /></EditorialSection></div>
        <EditorialSection title="Legal"><LinkDirectory links={legalLinks} offset={3} /></EditorialSection>
      </div>
      <p className="mt-14 max-w-2xl border-t border-white/14 pt-6 text-xs leading-relaxed text-white/58">Hormozi Said is an unofficial, fan-made project. It is not affiliated with, endorsed by, or sponsored by Alex Hormozi, Acquisition.com, or their related companies.</p>
    </main>
  );
}
