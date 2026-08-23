import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() { return <main className="page-wrap grid min-h-[70dvh] place-items-center"><div className="content-card max-w-md rounded-3xl p-8 text-center"><SearchX className="mx-auto size-9 text-[var(--purple-light)]" /><h1 className="display-type mt-5 text-5xl uppercase">Idea not found.</h1><p className="mt-2 text-sm text-white/50">The quote may have moved or its link is incomplete.</p><Button asChild className="mt-6 bg-white text-black hover:bg-white/90"><Link href="/">Read today’s quote</Link></Button></div></main>; }
