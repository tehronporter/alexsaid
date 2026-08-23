import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { SettingsView } from "@/components/settings-view";
import { catalog } from "@/lib/catalog";

export const metadata: Metadata = { title: "Settings" };
export default function SettingsPage() { return <main className="page-wrap"><PageHeader eyebrow="Make it yours" title="Settings" description="Control the feed and the data stored on this device." /><SettingsView categories={catalog.categories} /></main>; }
