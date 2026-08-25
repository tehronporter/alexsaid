import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OfflinePage() { return <main className="page-wrap grid min-h-[70dvh] place-items-center"><section className="max-w-md border-t border-white/18 py-10 text-center"><p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-[var(--purple-light)]">Connection unavailable</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">You’re offline.</h1><p className="mt-3 text-sm leading-relaxed text-white/62">Previously loaded quotes and saved ideas remain available.</p><Button asChild className="mt-7 bg-white text-black"><Link href="/app">Open quote feed</Link></Button></section></main>; }
