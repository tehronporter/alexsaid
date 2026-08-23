"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) { return <main className="page-wrap grid min-h-[70dvh] place-items-center"><div className="content-card max-w-md rounded-3xl p-8 text-center"><AlertTriangle className="mx-auto size-9 text-[var(--purple-light)]" /><h1 className="mt-5 text-2xl font-bold">That idea hit a snag.</h1><p className="mt-2 text-sm text-white/50">Your saved data is still on this device. Try loading the screen again.</p><Button className="mt-6 bg-white text-black hover:bg-white/90" onClick={retry}>Try again</Button></div></main>; }
