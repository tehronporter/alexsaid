import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileCheck2, Mail, Settings, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "More" };
const links = [
  { href: "/settings", title: "Settings", body: "Topics, local data, and feed preferences", icon: Settings },
  { href: "/disclaimer", title: "Disclaimer", body: "Unofficial status and source policy", icon: FileCheck2 },
  { href: "/privacy", title: "Privacy", body: "What stays on this device", icon: ShieldCheck }
];
export default function MorePage() {
  const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@example.com";
  return <main className="page-wrap"><PageHeader eyebrow="The useful details" title="More" description="Preferences, policies, and a direct way to suggest a source." /><div className="grid gap-3 lg:grid-cols-2">{links.map(({ href, title, body, icon: Icon }) => <Link key={href} href={href} className="content-card group flex items-center gap-4 rounded-2xl p-5"><span className="grid size-11 place-items-center rounded-xl bg-white/10"><Icon className="size-5" /></span><span className="flex-1"><span className="block font-bold">{title}</span><span className="mt-1 block text-sm text-white/45">{body}</span></span><ChevronRight className="size-5 text-white/35 transition-transform group-hover:translate-x-1" /></Link>)}<a href={`mailto:${contact}?subject=Hormozi%20Said%20quote%20suggestion`} className="content-card group flex items-center gap-4 rounded-2xl p-5"><span className="grid size-11 place-items-center rounded-xl bg-white/10"><Mail className="size-5" /></span><span className="flex-1"><span className="block font-bold">Suggest a quote</span><span className="mt-1 block text-sm text-white/45">Send the quote and its original source</span></span><ChevronRight className="size-5 text-white/35 transition-transform group-hover:translate-x-1" /></a></div><p className="mt-10 max-w-2xl text-xs leading-relaxed text-white/45">Hormozi Said is an unofficial, fan-made project. It is not affiliated with, endorsed by, or sponsored by Alex Hormozi, Acquisition.com, or their related companies.</p></main>;
}
