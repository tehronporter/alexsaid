"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) { return <main className="page-wrap grid min-h-[70dvh] place-items-center"><section className="max-w-md border-t border-white/18 py-10 text-center"><p className="text-[0.68rem] font-bold uppercase tracking-[0.17em] text-[var(--purple-light)]">Something went wrong</p><h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em]">That idea hit a snag.</h1><p className="mt-3 text-sm leading-relaxed text-white/62">Your saved data is still on this device. Try loading the screen again.</p><Button className="mt-7 bg-white text-black hover:bg-white/90" onClick={retry}>Try again</Button></section></main>; }
