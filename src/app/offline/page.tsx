import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() { return <main className="page-wrap grid min-h-[70dvh] place-items-center"><div className="content-card max-w-md rounded-3xl p-8 text-center"><WifiOff className="mx-auto size-9 text-[var(--purple-light)]" /><h1 className="display-type mt-5 text-5xl uppercase">You’re offline.</h1><p className="mt-2 text-sm text-white/50">Previously loaded quotes and saved ideas remain available.</p><Button asChild className="mt-6 bg-white text-black"><Link href="/">Open quote feed</Link></Button></div></main>; }
