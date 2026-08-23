import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SavedView } from "@/components/saved-view";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Saved Quotes", description: "Ideas you saved on this device." };
export default function SavedPage() { return <main className="page-wrap"><PageHeader eyebrow="Your library" title="Saved" description="The ideas worth returning to, stored privately on this device." /><SavedView quotes={catalog.quotes} /></main>; }
