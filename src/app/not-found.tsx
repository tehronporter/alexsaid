import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() { return <main className="page-wrap grid min-h-[70dvh] place-items-center"><section className="max-w-md border-t border-white/18 py-10 text-center"><p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-[var(--purple-light)]">404 / Quote unavailable</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">Idea not found.</h1><p className="mt-3 text-sm leading-relaxed text-white/62">The quote may have moved or its link is incomplete.</p><Button asChild className="mt-7 bg-white text-black hover:bg-white/90"><Link href="/">Read today’s quote</Link></Button></section></main>; }
